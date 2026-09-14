import {
  CRM_STAGES,
  CRM_STAGE_LABELS,
  type CrmAssignee,
  type CrmEvent,
  type CrmRecord,
  type CrmSnapshot,
  type CrmStage,
} from './crm';

/**
 * Бот менеджеров (TG-BOT-001, TG-BOT-002): кнопки «Взял» и этапов под заявкой,
 * команды, утренняя сводка и напоминания. Здесь нет server-only импортов:
 * Telegram и CRM приходят через TelegramIo, поэтому всё проверяется tsx-самопроверкой.
 */

export interface TelegramIo {
  snapshot(): Promise<CrmSnapshot>;
  append(events: CrmEvent[]): Promise<void>;
  isManager(userId: number): Promise<boolean>;
  api(method: string, body: Record<string, unknown>): Promise<void>;
}

interface TgUser { id: number; first_name?: string; username?: string }
interface TgMessage {
  message_id: number;
  message_thread_id?: number;
  is_topic_message?: boolean;
  chat: { id: number; type: string };
  from?: TgUser;
  text?: string;
  reply_markup?: Keyboard;
}
export interface TgUpdate {
  message?: TgMessage;
  callback_query?: { id: string; from: TgUser; data?: string; message?: TgMessage };
}
type Button = { text: string; callback_data?: string; url?: string };
type Keyboard = { inline_keyboard: Button[][] };

export const BOT_COMMANDS = [
  { command: 'new', description: 'Необработанные: никем не взятые и зависшие больше 2 дней' },
  { command: 'my', description: 'Мои заявки в работе' },
  { command: 'today', description: 'Заявки за сегодня' },
  { command: 'find', description: 'Поиск: /find +7701… или имя' },
  { command: 'stats', description: 'Цифры за 7 дней' },
  { command: 'crm', description: 'Открыть CRM' },
];

const STAGE_BUTTONS: [CrmStage, string][] = [
  ['contacted', 'Связались'],
  ['consultation', 'Разбор'],
  ['enrolled', 'Зачислен'],
  ['lost', 'Отказ'],
];
const OPEN_STAGES: CrmStage[] = ['new', 'contacted', 'consultation'];
// группа принимает около 20 сообщений от бота в минуту
const CARD_LIMIT = 5;
const STALE_MS = 2 * 24 * 60 * 60_000;
const REMIND_AFTER_MS = 15 * 60_000;
// старые заявки после первого запуска не напоминаем — для них утренняя сводка
const REMIND_WITHIN_MS = 24 * 60 * 60_000;
const STATUS_MARK = '\n\nСтатус: ';
/** Заметка в CRM после напоминания: по ней же второй раз не напоминаем. */
export const REMINDER_NOTE = 'Бот напомнил в Telegram: заявку никто не взял';

/** Ссылка Mini App (на карточку, если передан runId); кривая настройка — без ссылки. */
export function crmLink(runId?: string): string | undefined {
  const appUrl = process.env.ASHYQ_TELEGRAM_APP_URL;
  if (!appUrl?.startsWith('https://t.me/')) return undefined;
  if (runId === undefined) return appUrl;
  // startapp пропускает только A-Za-z0-9_-
  return /^[\w-]+$/.test(runId) ? `${appUrl}?startapp=${runId}` : undefined;
}

function crmButton(text: string): Keyboard | undefined {
  const url = crmLink();
  return url ? { inline_keyboard: [[{ text, url }]] } : undefined;
}

/** Кнопки под заявкой: «Взял» и этапы (если бот принимает нажатия) и «Открыть в CRM». */
export function leadKeyboard(runId: string): Keyboard | undefined {
  const rows: Button[][] = [];
  const actions = [
    { text: '🙋 Взял', callback_data: `a:${runId}` },
    ...STAGE_BUTTONS.map(([stage, text]) => ({ text, callback_data: `s:${stage}:${runId}` })),
  ];
  // callback_data у Telegram — не больше 64 байт
  if (process.env.ASHYQ_TELEGRAM_WEBHOOK_SECRET && actions.every((button) => Buffer.byteLength(button.callback_data) <= 64)) {
    rows.push(actions.slice(0, 3), actions.slice(3));
  }
  const url = crmLink(runId);
  if (url) rows.push([{ text: 'Открыть в CRM', url }]);
  return rows.length > 0 ? { inline_keyboard: rows } : undefined;
}

const almatyDay = (value: string | number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty' }).format(new Date(value));
const almatyTime = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Almaty', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

/**
 * Необработанные: «Новый», который никто не взял, и зависшие без движения
 * больше 2 дней в открытых этапах. Без телефона звонить некуда.
 */
export function unprocessed(records: CrmRecord[], now: number = Date.now()): CrmRecord[] {
  const withPhone = records.filter((record) => record.phone);
  const untaken = withPhone.filter((record) => record.stage === 'new' && !record.assignee);
  const stale = withPhone.filter((record) =>
    !untaken.includes(record) && OPEN_STAGES.includes(record.stage) && now - Date.parse(record.lastSeenAt) > STALE_MS);
  return [...untaken, ...stale];
}

/** Открытые заявки менеджера. */
export function mine(records: CrmRecord[], userId: number): CrmRecord[] {
  return records.filter((record) => record.assignee?.id === userId && OPEN_STAGES.includes(record.stage));
}

/** Заявки с телефоном, пришедшие сегодня по времени Алматы. */
export function today(records: CrmRecord[], now: number = Date.now()): CrmRecord[] {
  const day = almatyDay(now);
  return records.filter((record) => record.phone && almatyDay(record.firstSeenAt) === day);
}

/** Поиск по телефону (8 701… и +7 701… — один номер) или имени. */
export function findRecords(records: CrmRecord[], query: string): CrmRecord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const digits = needle.replace(/\D/g, '').replace(/^8(?=\d{10}$)/, '7');
  return records.filter((record) =>
    (digits.length >= 4 && record.phone?.includes(digits)) || record.name?.toLowerCase().includes(needle));
}

/** Новые заявки, которые никто не взял за 15 минут и о которых бот ещё не напоминал. */
export function dueReminders(records: CrmRecord[], now: number = Date.now()): CrmRecord[] {
  return records.filter((record) => {
    const age = now - Date.parse(record.firstSeenAt);
    return record.phone && record.stage === 'new' && !record.assignee
      && age >= REMIND_AFTER_MS && age < REMIND_WITHIN_MS
      && !record.activities.some((activity) => activity.text === REMINDER_NOTE);
  });
}

export function recordText(record: CrmRecord): string {
  const lines = [`${record.name ?? 'Без имени'} · ${record.exam.toUpperCase()}`];
  if (record.phone) lines.push(`Телефон: +${record.phone}`);
  lines.push(`Этап: ${CRM_STAGE_LABELS[record.stage]}`);
  if (record.assignee) lines.push(`Взял: ${record.assignee.name}`);
  if (record.grade) lines.push(`Класс: ${record.grade}`);
  if (record.band) lines.push(`Результат: ${record.band}`);
  if (record.source) lines.push(`Источник: ${record.source}`);
  lines.push(`Пришла: ${almatyTime(record.firstSeenAt)}`);
  if (record.phone) lines.push('', `Написать: https://wa.me/${record.phone}`);
  return lines.join('\n');
}

export function statsText(snapshot: CrmSnapshot, now: number = Date.now()): string {
  const { stats } = snapshot;
  return [
    '📊 ASHYQ',
    `Лидов за 7 дней: ${stats.analytics.leadsLast7Days}`,
    `Необработанных сейчас: ${unprocessed(snapshot.records, now).length}`,
    '',
    'Этапы, всё время:',
    ...CRM_STAGES.map((stage) => `${CRM_STAGE_LABELS[stage]}: ${stats.byStage[stage]}`),
    ...(stats.analytics.bySource.length > 0
      ? ['', 'Источники:', ...stats.analytics.bySource.slice(0, 3).map((row) => `${row.source}: ${row.leads}`)]
      : []),
  ].join('\n');
}

function waited(since: string, now: number): string {
  const hours = Math.floor((now - Date.parse(since)) / 3_600_000);
  return hours < 24 ? `${hours} ч` : `${Math.floor(hours / 24)} дн.`;
}

/** Утренняя сводка: что пришло вчера (по Алматы) и что ждёт ответа. */
export function digestText(records: CrmRecord[], now: number = Date.now()): string {
  const yesterday = almatyDay(now - 24 * 60 * 60_000);
  const came = records.filter((record) => record.phone && almatyDay(record.firstSeenAt) === yesterday);
  const season = came.filter((record) => record.kind === 'season').length;
  const open = unprocessed(records, now);
  const untaken = open.filter((record) => record.stage === 'new' && !record.assignee).length;
  const longest = [...open].sort((a, b) => a.lastSeenAt.localeCompare(b.lastSeenAt)).slice(0, 3);
  return [
    '☀️ Заявки ASHYQ — утро',
    `Вчера пришло: ${came.length}${season > 0 ? ` (на сезон: ${season})` : ''}`,
    `Никто не взял: ${untaken}`,
    `Зависли больше 2 дней: ${open.length - untaken}`,
    ...(longest.length > 0
      ? ['', 'Дольше всех ждут:', ...longest.map((record) => `• ${record.name ?? 'Без имени'} +${record.phone} — ${waited(record.lastSeenAt, now)}`)]
      : []),
    '',
    '/new — разобрать',
  ].join('\n');
}

function statusLine(stage: CrmStage, assignee?: CrmAssignee): string {
  return `${CRM_STAGE_LABELS[stage]}${assignee ? ` · взял ${assignee.name}` : ''}`;
}

function displayName(user: TgUser): string {
  return user.first_name ?? user.username ?? String(user.id);
}

/** «Взял» (a:runId) и этапы (s:stage:runId). Этап без ответственного назначает нажавшего. */
async function handleButton(query: NonNullable<TgUpdate['callback_query']>, io: TelegramIo): Promise<void> {
  const answer = (text?: string, alert = false) =>
    io.api('answerCallbackQuery', { callback_query_id: query.id, text, show_alert: alert || undefined });

  const [, rawStage, runId] = /^(?:a|s:(\w+)):(.+)$/.exec(query.data ?? '') ?? [];
  const stage = STAGE_BUTTONS.find(([item]) => item === rawStage)?.[0];
  if (!runId || (rawStage && !stage)) return answer();
  if (!(await io.isManager(query.from.id))) return answer('Нет доступа: только участники группы с заявками', true);

  const record = (await io.snapshot()).records.find((item) => item.runId === runId);
  if (!record) return answer('Заявка не найдена в CRM', true);

  const me: CrmAssignee = { id: query.from.id, name: displayName(query.from) };
  const assignee = stage && record.assignee ? record.assignee : me;
  const createdAt = new Date().toISOString();
  const events: CrmEvent[] = [];
  if (assignee.id !== record.assignee?.id) {
    events.push({ id: crypto.randomUUID(), runId, type: 'assign', assignee, createdAt });
  }
  if (stage) {
    events.push(
      { id: crypto.randomUUID(), runId, type: 'stage_change', stage, createdAt },
      { id: crypto.randomUUID(), runId, type: 'note', body: `Telegram: ${me.name}`, createdAt },
    );
  }
  if (events.length > 0) await io.append(events);
  await answer(stage ? `Этап: ${CRM_STAGE_LABELS[stage]}` : `Заявка на тебе, ${me.name}`);

  const message = query.message;
  if (!message?.text) return;
  const text = `${message.text.split(STATUS_MARK)[0]}${STATUS_MARK}${statusLine(stage ?? record.stage, assignee)}`;
  // тот же текст Telegram отклоняет («message is not modified»)
  if (text === message.text) return;
  await io.api('editMessageText', {
    chat_id: message.chat.id,
    message_id: message.message_id,
    text,
    reply_markup: message.reply_markup,
    disable_web_page_preview: true,
  });
}

async function sendCards(send: (text: string, replyMarkup?: Keyboard) => Promise<void>, list: CrmRecord[], empty: string, prefix = '') {
  if (list.length === 0) {
    if (empty) await send(empty);
    return;
  }
  for (const record of list.slice(0, CARD_LIMIT)) await send(`${prefix}${recordText(record)}`, leadKeyboard(record.runId));
  if (list.length > CARD_LIMIT) await send(`Ещё ${list.length - CARD_LIMIT} — в CRM`, crmButton('Открыть CRM'));
}

const HELP = ['Команды:', ...BOT_COMMANDS.map(({ command, description }) => `/${command} — ${description}`)].join('\n');

async function handleCommand(message: TgMessage, io: TelegramIo, now: number): Promise<void> {
  // данные заявок — только в группу заявок или в личку с ботом
  const isPrivate = message.chat.type === 'private';
  if (!isPrivate && String(message.chat.id) !== process.env.ASHYQ_TELEGRAM_CHAT_ID) return;

  const reply = (text: string, replyMarkup?: Keyboard) =>
    io.api('sendMessage', {
      chat_id: message.chat.id,
      message_thread_id: message.is_topic_message ? message.message_thread_id : undefined,
      text,
      reply_markup: replyMarkup,
      disable_web_page_preview: true,
    });

  const userId = message.from?.id;
  if (userId === undefined || !(await io.isManager(userId))) {
    if (isPrivate) await reply('Нет доступа: бот отвечает только участникам группы с заявками.');
    return;
  }

  const [, command = '', args = ''] = /^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/.exec(message.text ?? '') ?? [];
  switch (command.toLowerCase()) {
    case 'new':
      return sendCards(reply, unprocessed((await io.snapshot()).records, now), 'Необработанных заявок нет 🎉');
    case 'my':
      return sendCards(reply, mine((await io.snapshot()).records, userId), 'На тебе нет открытых заявок');
    case 'today':
      return sendCards(reply, today((await io.snapshot()).records, now), 'Сегодня заявок пока нет');
    case 'find':
      if (!args.trim()) return reply('Напиши, кого искать: /find +77012345678 или /find Аружан');
      return sendCards(reply, findRecords((await io.snapshot()).records, args), 'Ничего не нашлось');
    case 'stats':
      return reply(statsText(await io.snapshot(), now));
    case 'crm':
      return reply(crmLink() ? 'CRM заявок' : 'Mini App не настроен: нужен ASHYQ_TELEGRAM_APP_URL', crmButton('Открыть CRM'));
    case 'start':
    case 'help':
      return reply(HELP);
    // чужие команды в группе молчат: там могут быть другие боты
  }
}

export async function handleUpdate(update: TgUpdate, io: TelegramIo, now: number = Date.now()): Promise<void> {
  if (update.callback_query) return handleButton(update.callback_query, io);
  if (update.message?.text?.startsWith('/')) return handleCommand(update.message, io, now);
}

/** Задачи по расписанию в группу заявок; возвращает число отправленных сообщений. */
export async function runCron(job: 'digest' | 'remind', io: TelegramIo, now: number = Date.now()): Promise<number> {
  const chatId = process.env.ASHYQ_TELEGRAM_CHAT_ID;
  if (!chatId) return 0;
  let sent = 0;
  const send = async (text: string, replyMarkup?: Keyboard) => {
    await io.api('sendMessage', {
      chat_id: chatId,
      message_thread_id: process.env.ASHYQ_TELEGRAM_THREAD_ID ? Number(process.env.ASHYQ_TELEGRAM_THREAD_ID) : undefined,
      text,
      reply_markup: replyMarkup,
      disable_web_page_preview: true,
    });
    sent += 1;
  };

  const { records } = await io.snapshot();
  if (job === 'digest') {
    await send(digestText(records, now), crmButton('Открыть CRM'));
    return sent;
  }

  for (const record of dueReminders(records, now).slice(0, CARD_LIMIT)) {
    await send(`⏰ Заявку никто не взял 15+ минут\n\n${recordText(record)}`, leadKeyboard(record.runId));
    // после отправки: если Telegram не принял, напомним на следующем запуске
    await io.append([{ id: crypto.randomUUID(), runId: record.runId, type: 'note', body: REMINDER_NOTE, createdAt: new Date(now).toISOString() }]);
  }
  return sent;
}

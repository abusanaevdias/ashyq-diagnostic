import { CRM_STAGES, CRM_STAGE_LABELS, type CrmEvent, type CrmRecord, type CrmSnapshot, type CrmStage } from './crm';

/**
 * Бот менеджеров (TG-BOT-001): кнопки этапов под заявкой и команды.
 * Здесь нет server-only импортов: Telegram и CRM приходят через TelegramIo,
 * поэтому обработчик целиком проверяется tsx-самопроверкой.
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
  { command: 'new', description: 'Необработанные: новые и зависшие больше 2 дней' },
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
// группа принимает около 20 сообщений от бота в минуту
const CARD_LIMIT = 5;
const STALE_MS = 2 * 24 * 60 * 60_000;
const STATUS_MARK = '\n\nСтатус: ';

/** Ссылка Mini App (на карточку, если передан runId); кривая настройка — без ссылки. */
export function crmLink(runId?: string): string | undefined {
  const appUrl = process.env.ASHYQ_TELEGRAM_APP_URL;
  if (!appUrl?.startsWith('https://t.me/')) return undefined;
  if (runId === undefined) return appUrl;
  // startapp пропускает только A-Za-z0-9_-
  return /^[\w-]+$/.test(runId) ? `${appUrl}?startapp=${runId}` : undefined;
}

/** Кнопки под заявкой: этапы (если бот принимает нажатия) и «Открыть в CRM». */
export function leadKeyboard(runId: string): Keyboard | undefined {
  const rows: Button[][] = [];
  const stages = STAGE_BUTTONS.map(([stage, text]) => ({ text, callback_data: `s:${stage}:${runId}` }));
  // callback_data у Telegram — не больше 64 байт
  if (process.env.ASHYQ_TELEGRAM_WEBHOOK_SECRET && stages.every((button) => Buffer.byteLength(button.callback_data) <= 64)) {
    rows.push(stages.slice(0, 2), stages.slice(2));
  }
  const url = crmLink(runId);
  if (url) rows.push([{ text: 'Открыть в CRM', url }]);
  return rows.length > 0 ? { inline_keyboard: rows } : undefined;
}

const almatyDay = (value: string | number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty' }).format(new Date(value));
const almatyTime = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Almaty', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

/** Необработанные: «Новый» и зависшие без движения больше 2 дней в «Связались»/«Разбор». Без телефона звонить некуда. */
export function unprocessed(records: CrmRecord[], now: number = Date.now()): CrmRecord[] {
  const withPhone = records.filter((record) => record.phone);
  return [
    ...withPhone.filter((record) => record.stage === 'new'),
    ...withPhone.filter((record) =>
      (record.stage === 'contacted' || record.stage === 'consultation') && now - Date.parse(record.lastSeenAt) > STALE_MS),
  ];
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

export function recordText(record: CrmRecord): string {
  const lines = [`${record.name ?? 'Без имени'} · ${record.exam.toUpperCase()}`];
  if (record.phone) lines.push(`Телефон: +${record.phone}`);
  lines.push(`Этап: ${CRM_STAGE_LABELS[record.stage]}`);
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

const HELP = ['Команды:', ...BOT_COMMANDS.map(({ command, description }) => `/${command} — ${description}`)].join('\n');

function displayName(user: TgUser): string {
  return user.first_name ?? user.username ?? String(user.id);
}

async function handleStageButton(query: NonNullable<TgUpdate['callback_query']>, io: TelegramIo): Promise<void> {
  const [, stage, runId] = /^s:(\w+):(.+)$/.exec(query.data ?? '') ?? [];
  const known = STAGE_BUTTONS.some(([item]) => item === stage);
  if (!known || !runId) {
    await io.api('answerCallbackQuery', { callback_query_id: query.id });
    return;
  }
  if (!(await io.isManager(query.from.id))) {
    await io.api('answerCallbackQuery', { callback_query_id: query.id, text: 'Нет доступа: только участники группы с заявками', show_alert: true });
    return;
  }

  const who = displayName(query.from);
  const label = CRM_STAGE_LABELS[stage as CrmStage];
  const createdAt = new Date().toISOString();
  await io.append([
    { id: crypto.randomUUID(), runId, type: 'stage_change', stage: stage as CrmStage, createdAt },
    { id: crypto.randomUUID(), runId, type: 'note', body: `Telegram: ${who}`, createdAt },
  ]);
  await io.api('answerCallbackQuery', { callback_query_id: query.id, text: `Этап: ${label}` });

  const message = query.message;
  if (message?.text) {
    await io.api('editMessageText', {
      chat_id: message.chat.id,
      message_id: message.message_id,
      text: `${message.text.split(STATUS_MARK)[0]}${STATUS_MARK}${label} — ${who}`,
      reply_markup: message.reply_markup,
      disable_web_page_preview: true,
    });
  }
}

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

  if (!message.from || !(await io.isManager(message.from.id))) {
    if (isPrivate) await reply('Нет доступа: бот отвечает только участникам группы с заявками.');
    return;
  }

  const [, command = '', args = ''] = /^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/.exec(message.text ?? '') ?? [];
  const crmButton = (text: string): Keyboard | undefined => {
    const url = crmLink();
    return url ? { inline_keyboard: [[{ text, url }]] } : undefined;
  };
  const sendCards = async (list: CrmRecord[], empty: string) => {
    if (list.length === 0) {
      await reply(empty);
      return;
    }
    for (const record of list.slice(0, CARD_LIMIT)) await reply(recordText(record), leadKeyboard(record.runId));
    if (list.length > CARD_LIMIT) await reply(`Ещё ${list.length - CARD_LIMIT} — в CRM`, crmButton('Открыть CRM'));
  };

  switch (command.toLowerCase()) {
    case 'new':
      return sendCards(unprocessed((await io.snapshot()).records, now), 'Необработанных заявок нет 🎉');
    case 'today':
      return sendCards(today((await io.snapshot()).records, now), 'Сегодня заявок пока нет');
    case 'find':
      if (!args.trim()) return reply('Напиши, кого искать: /find +77012345678 или /find Аружан');
      return sendCards(findRecords((await io.snapshot()).records, args), 'Ничего не нашлось');
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
  if (update.callback_query) return handleStageButton(update.callback_query, io);
  if (update.message?.text?.startsWith('/')) return handleCommand(update.message, io, now);
}

// Самопроверка подписи Telegram Mini App (TG-MINIAPP-001): npx tsx scripts/telegram-check.ts
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import type { CrmEvent, CrmRecord, CrmSnapshot } from '../src/lib/crm';
import { isTelegramManagerRequest, verifyInitData } from '../src/lib/telegram-auth';
import {
  REMINDER_NOTE,
  dueReminders,
  findRecords,
  handleUpdate,
  leadKeyboard,
  mine,
  runCron,
  today,
  unprocessed,
  type TelegramIo,
  type TgUpdate,
} from '../src/lib/telegram-bot';

const token = '123:abc';
const now = Date.parse('2026-09-15T10:00:00Z');

// подпись по документации Telegram, независимо от проверяемого кода
function sign(fields: Record<string, string>, botToken = token): string {
  const checkString = Object.keys(fields).sort().map((key) => `${key}=${fields[key]}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = createHmac('sha256', secret).update(checkString).digest('hex');
  return new URLSearchParams({ ...fields, hash }).toString();
}

const fresh = {
  auth_date: String(now / 1000 - 60),
  user: JSON.stringify({ id: 42, first_name: 'Аружан' }),
  start_param: 'run_1',
};

assert.equal(verifyInitData(sign(fresh), token, now), 42, 'верная подпись — id пользователя');
assert.equal(verifyInitData(sign(fresh, '999:other'), token, now), null, 'подпись другого бота');
assert.equal(verifyInitData(sign(fresh).replace('run_1', 'run_2'), token, now), null, 'подменённое поле');
assert.equal(verifyInitData(sign({ ...fresh, auth_date: String(now / 1000 - 2 * 86_400) }), token, now), null, 'старше суток');
assert.equal(verifyInitData(sign({ auth_date: fresh.auth_date }), token, now), null, 'без user');
assert.equal(verifyInitData('', token, now), null, 'пусто');

// доступ = участник группы заявок: ответ getChatMember подменяем
process.env.ASHYQ_TELEGRAM_BOT_TOKEN = token;
process.env.ASHYQ_TELEGRAM_CHAT_ID = '-100500';
const request = (fields: Record<string, string>) =>
  new Request('https://ashyq.example/api/crm', { headers: { 'x-telegram-init-data': sign(fields) } });
const member = (id: number, status: string) => {
  globalThis.fetch = async () => Response.json({ ok: true, result: { status } });
  return { ...fresh, auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify({ id }) };
};

(async () => {
  assert.equal(await isTelegramManagerRequest(request(member(1, 'member'))), true, 'участник группы');
  assert.equal(await isTelegramManagerRequest(request(member(2, 'left'))), false, 'вышел из группы');
  assert.equal(await isTelegramManagerRequest(request(member(3, 'kicked'))), false, 'удалён из группы');
  const failing = member(4, 'member');
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.equal(await isTelegramManagerRequest(request(failing)), false, 'Telegram недоступен — не пускаем');
  assert.equal(await isTelegramManagerRequest(new Request('https://ashyq.example/api/crm')), false, 'без заголовка');

  // бот менеджеров (TG-BOT-001)
  process.env.ASHYQ_TELEGRAM_WEBHOOK_SECRET = 'a1'.repeat(32);
  process.env.ASHYQ_TELEGRAM_APP_URL = 'https://t.me/ashyq_bot/crm';
  assert.equal(leadKeyboard('mf1-abc')?.inline_keyboard.length, 3, 'этапы в два ряда + CRM');
  assert.equal(leadKeyboard('x'.repeat(64))?.inline_keyboard.length, 1, 'runId не влезает в callback_data — только CRM');

  const botNow = Date.parse('2026-09-15T20:00:00Z'); // 16 сентября, 01:00 в Алматы
  const rec = (runId: string, stage: CrmRecord['stage'], at: string, extra: Partial<CrmRecord> = {}): CrmRecord => ({
    runId, exam: 'ielts', kind: 'contact', name: 'Аружан', phone: '77012345678', stage,
    firstSeenAt: at, lastSeenAt: at, activities: [], delivery: [], ...extra,
  });
  const records = [
    rec('new-1', 'new', '2026-09-15T19:30:00Z'), // 00:30 в Алматы — уже сегодня
    rec('new-nophone', 'new', '2026-09-15T19:40:00Z', { phone: undefined }),
    rec('taken-new', 'new', '2026-09-15T19:50:00Z', { phone: '77015550001', assignee: { id: 8, name: 'Дана' } }),
    rec('stale', 'contacted', '2026-09-12T10:00:00Z', { name: 'Дана', phone: '77770001122' }),
    rec('fresh-contacted', 'contacted', '2026-09-15T18:30:00Z'), // 23:30 в Алматы — вчера
    rec('done', 'enrolled', '2026-09-01T10:00:00Z'),
    rec('mine', 'contacted', '2026-09-15T12:00:00Z', { phone: '77015550000', assignee: { id: 7, name: 'Аружан' } }),
  ];
  assert.deepEqual(unprocessed(records, botNow).map((r) => r.runId), ['new-1', 'stale'], 'никем не взятые + зависшие, взятые свежие не в списке');
  assert.deepEqual(today(records, botNow).map((r) => r.runId), ['new-1', 'taken-new'], 'сегодня по Алматы, только с телефоном');
  assert.deepEqual(mine(records, 7).map((r) => r.runId), ['mine'], 'мои открытые');
  const reminded = rec('reminded', 'new', '2026-09-15T19:00:00Z', {
    activities: [{ id: 'r', type: 'note', text: REMINDER_NOTE, createdAt: '2026-09-15T19:20:00Z' }],
  });
  assert.deepEqual(
    dueReminders([...records, reminded, rec('old-new', 'new', '2026-09-10T10:00:00Z'), rec('just-now', 'new', '2026-09-15T19:55:00Z')], botNow).map((r) => r.runId),
    ['new-1'],
    'напоминание: не взяли 15+ мин, не старше суток, один раз',
  );
  assert.deepEqual(findRecords(records, '8 701 234 56 78').map((r) => r.runId), ['new-1', 'fresh-contacted', 'done'], 'номер через 8');
  assert.deepEqual(findRecords(records, 'дан').map((r) => r.runId), ['stale'], 'имя без регистра');

  const stats = { byStage: { new: 2, contacted: 2, consultation: 0, enrolled: 1, lost: 0 }, analytics: { leadsLast7Days: 4, bySource: [] } };
  const calls: [string, Record<string, unknown>][] = [];
  const appended: CrmEvent[] = [];
  const io: TelegramIo = {
    snapshot: async () => ({ records, stats }) as unknown as CrmSnapshot,
    append: async (events) => { appended.push(...events); },
    isManager: async (id) => id === 7,
    api: async (method, body) => { calls.push([method, body]); },
  };
  const group = { id: -100500, type: 'supergroup' };
  const press = (data: string, text: string, from = { id: 7, first_name: 'Аружан' }): TgUpdate =>
    ({ callback_query: { id: 'q', from, data, message: { message_id: 10, chat: group, text } } });
  const lastEdit = () => calls.filter(([method]) => method === 'editMessageText').at(-1)?.[1].text;

  await handleUpdate(press('s:contacted:new-1', '🔴 НОВОЕ ОБРАЩЕНИЕ'), io, botNow);
  assert.deepEqual(
    appended.map((e) => [e.type, e.stage ?? e.body ?? e.assignee?.name, e.runId]),
    [['assign', 'Аружан', 'new-1'], ['stage_change', 'contacted', 'new-1'], ['note', 'Telegram: Аружан', 'new-1']],
    'этап без ответственного назначает нажавшего',
  );
  assert.equal(lastEdit(), '🔴 НОВОЕ ОБРАЩЕНИЕ\n\nСтатус: Связались · взял Аружан', 'сообщение дополнено статусом');
  await handleUpdate(press('s:lost:new-1', String(lastEdit())), io, botNow);
  assert.equal(lastEdit(), '🔴 НОВОЕ ОБРАЩЕНИЕ\n\nСтатус: Неактуально · взял Аружан', 'повторное нажатие заменяет статус');

  appended.length = 0;
  await handleUpdate(press('s:lost:taken-new', 'x'), io, botNow);
  assert.deepEqual(appended.map((e) => e.type), ['stage_change', 'note'], 'этап не отбирает заявку у ответственного');
  assert.equal(lastEdit(), 'x\n\nСтатус: Неактуально · взял Дана', 'в статусе прежний ответственный');
  appended.length = 0;
  await handleUpdate(press('a:taken-new', 'x'), io, botNow);
  assert.deepEqual(appended.map((e) => [e.type, e.assignee?.name]), [['assign', 'Аружан']], '«Взял» забирает заявку');
  calls.length = 0;
  await handleUpdate(press('a:mine', 'y\n\nСтатус: Связались · взял Аружан'), io, botNow);
  assert.equal(calls.some(([method]) => method === 'editMessageText'), false, 'тот же текст не редактируем (message is not modified)');
  calls.length = 0;
  await handleUpdate(press('a:missing', 'z'), io, botNow);
  assert.equal(calls[0]?.[1].show_alert, true, 'неизвестная заявка — отказ');

  calls.length = 0;
  appended.length = 0;
  await handleUpdate(press('s:contacted:new-1', 'x', { id: 99, first_name: 'Чужой' }), io, botNow);
  assert.equal(appended.length, 0, 'не участник не меняет этап');
  assert.equal(calls[0]?.[1].show_alert, true, 'не участнику — отказ');

  const command = (text: string, chat = group): TgUpdate =>
    ({ message: { message_id: 1, chat, from: { id: 7 }, text, is_topic_message: true, message_thread_id: 1885 } });
  const sent = async (update: TgUpdate, custom = io) => {
    calls.length = 0;
    await handleUpdate(update, custom, botNow);
    return calls.map(([, body]) => body);
  };

  const cards = await sent(command('/new@ashyq_bot'));
  assert.deepEqual(cards.map((body) => body.message_thread_id), [1885, 1885], '/new — по карточке в ту же тему');
  assert.match(String(cards[0].text), /Этап: Новый/, 'карточка с этапом');
  assert.equal((cards[0].reply_markup as { inline_keyboard: unknown[] }).inline_keyboard.length, 3, 'у карточки кнопки этапов');
  assert.equal((await sent(command('/new', { id: -1009, type: 'group' }))).length, 0, 'чужая группа — молчим');
  assert.match(String((await sent(command('/find')))[0].text), /кого искать/, 'пустой /find — подсказка');
  assert.match(String((await sent(command('/stats')))[0].text), /Необработанных сейчас: 2/, '/stats');
  assert.equal((await sent(command('/unknown'))).length, 0, 'чужая команда — молчим');

  const many = Array.from({ length: 7 }, (_, index) => rec(`m${index}`, 'new', '2026-09-15T19:00:00Z'));
  const capped = await sent(command('/new'), { ...io, snapshot: async () => ({ records: many, stats }) as unknown as CrmSnapshot });
  assert.equal(capped.length, 6, 'не больше 5 карточек + ссылка на остальное');
  assert.match(String(capped[5].text), /Ещё 2/, 'сколько осталось');
  assert.deepEqual((await sent(command('/my'))).map((body) => String(body.text).split('\n')[0]), ['Аружан · IELTS'], '/my — мои открытые');

  // расписание: напоминания и утренняя сводка — в тему заявок
  process.env.ASHYQ_TELEGRAM_THREAD_ID = '1885';
  calls.length = 0;
  appended.length = 0;
  assert.equal(await runCron('remind', io, botNow), 1, 'одно напоминание: new-1');
  assert.match(String(calls[0][1].text), /никто не взял/, 'текст напоминания');
  assert.equal(calls[0][1].message_thread_id, 1885, 'в тему заявок');
  assert.deepEqual(appended.map((e) => [e.runId, e.body]), [['new-1', REMINDER_NOTE]], 'напоминание отмечено в CRM');
  calls.length = 0;
  assert.equal(await runCron('digest', io, botNow), 1, 'сводка — одно сообщение');
  const digest = String(calls[0][1].text);
  assert.match(digest, /Вчера пришло: 2/, 'вчера по Алматы');
  assert.match(digest, /Никто не взял: 1/, 'невзятые');
  assert.match(digest, /Зависли больше 2 дней: 1/, 'зависшие');

  console.log('telegram-check: ok');
})();

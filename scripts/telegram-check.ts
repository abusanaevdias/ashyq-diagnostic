// Самопроверка подписи Telegram Mini App (TG-MINIAPP-001): npx tsx scripts/telegram-check.ts
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { isTelegramManagerRequest, verifyInitData } from '../src/lib/telegram-auth';

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
  console.log('telegram-check: ok');
})();

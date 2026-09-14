// Самопроверка src/lib/env.ts (DEPLOY-PREP-001): npx tsx scripts/env-check.ts
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkEnv, checkLeadsDir, checkSupabaseLeads, resolveLeadsStorage } from '../src/lib/env';

const prod = {
  NEXT_PUBLIC_SITE_URL: 'https://ashyq.example',
  NEXT_PUBLIC_ASHYQ_WHATSAPP: '77067080181',
  ASHYQ_ADMIN_KEY: 'k'.repeat(64),
  ASHYQ_TELEGRAM_BOT_TOKEN: '123:abc',
  ASHYQ_TELEGRAM_CHAT_ID: '-100500',
};
const count = (env: Record<string, string | undefined>) => {
  const { errors, warnings } = checkEnv(env);
  return [errors.length, warnings.length];
};

assert.deepEqual(checkEnv(prod), { errors: [], warnings: [] }, 'полная прод-конфигурация чистая');
assert.deepEqual(count({}), [0, 3], 'пустое окружение (CI, локально) работает: только предупреждения');
assert.deepEqual(count({ ...prod, ASHYQ_ADMIN_KEY: 'short' }), [1, 0], 'короткий ключ CRM — ошибка');
assert.deepEqual(count({ ...prod, ASHYQ_LEAD_WEBHOOK_URL: 'http://hook' }), [1, 0], 'webhook без https — ошибка');
assert.deepEqual(count({ ...prod, ASHYQ_TELEGRAM_CHAT_ID: undefined }), [1, 1], 'половина Telegram — ошибка и нет канала');
assert.deepEqual(count({ ...prod, ASHYQ_TELEGRAM_BOT_TOKEN: undefined, ASHYQ_TELEGRAM_CHAT_ID: undefined, ASHYQ_LEAD_WEBHOOK_URL: 'https://hook' }), [0, 0], 'webhook по https — достаточный канал');
assert.deepEqual(count({ ...prod, NEXT_PUBLIC_SITE_URL: 'http://ashyq.example', NEXT_PUBLIC_ASHYQ_WHATSAPP: '+7 706', ASHYQ_NOTIFY_ALL: 'yes' }), [0, 3], 'сомнительные значения — предупреждения');
assert.deepEqual(count({ ...prod, ASHYQ_TELEGRAM_APP_URL: 'https://t.me/ashyq_bot/crm' }), [0, 0], 'ссылка Mini App — чисто');
assert.deepEqual(count({ ...prod, ASHYQ_TELEGRAM_APP_URL: 'https://ashyq.example/crm' }), [0, 1], 'не t.me — кнопки не будет, предупреждение');
assert.deepEqual(count({ ...prod, ASHYQ_TELEGRAM_WEBHOOK_SECRET: 'a1'.repeat(32) }), [0, 0], 'секрет webhook — чисто');
assert.deepEqual(count({ ...prod, ASHYQ_TELEGRAM_WEBHOOK_SECRET: 'short' }), [1, 0], 'короткий секрет webhook — ошибка');

const supabase = { ...prod, ASHYQ_LEADS_PROVIDER: 'supabase', ASHYQ_SUPABASE_URL: 'https://project.supabase.co/', ASHYQ_SUPABASE_SERVICE_ROLE_KEY: 'service-role' };
assert.deepEqual(count(supabase), [0, 0], 'Supabase по https с ключом — чисто');
assert.deepEqual(count({ ...supabase, ASHYQ_SUPABASE_URL: 'http://localhost:54321' }), [0, 0], 'локальный Supabase по http допустим');
assert.deepEqual(count({ ...supabase, ASHYQ_SUPABASE_URL: 'http://db.example' }), [1, 0], 'Supabase по http вне localhost — ошибка');
assert.deepEqual(count({ ...supabase, ASHYQ_SUPABASE_SERVICE_ROLE_KEY: undefined }), [1, 0], 'Supabase без ключа — ошибка');
assert.deepEqual(count({ ...supabase, ASHYQ_LEADS_PROVIDER: undefined }), [0, 1], 'Supabase задан, но не включён — предупреждение');
assert.deepEqual(count({ ...prod, ASHYQ_LEADS_PROVIDER: 'postgres' }), [0, 1], 'неизвестный провайдер — предупреждение');

const auth = { ...prod, NEXT_PUBLIC_AUTH_PROVIDER: 'supabase', NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon' };
assert.deepEqual(count(auth), [0, 0], 'вход через Supabase с адресом и anon-ключом — чисто');
assert.deepEqual(count({ ...auth, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined }), [1, 0], 'вход через Supabase без anon-ключа — ошибка');
assert.deepEqual(count({ ...auth, NEXT_PUBLIC_SUPABASE_URL: 'http://db.example' }), [1, 0], 'вход через Supabase по http вне localhost — ошибка');
assert.deepEqual(count({ ...prod, NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'secret' }), [1, 0], 'секретный ключ в NEXT_PUBLIC_* — ошибка');

// Vercel (LEADS-VERCEL-001): интеграция Supabase задаёт SUPABASE_*, а диск read-only
const integration = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-role' };
assert.equal(resolveLeadsStorage({ VERCEL: '1', ...integration }).provider, 'supabase', 'Vercel + ключи интеграции — заявки в Supabase сами');
assert.equal(resolveLeadsStorage(integration).provider, 'file', 'вне Vercel без явного провайдера — файлы (dev не переключается сам)');
assert.equal(resolveLeadsStorage({ ASHYQ_LEADS_PROVIDER: 'supabase', ...integration }).key, 'service-role', 'явный провайдер берёт ключ интеграции');
assert.deepEqual(count({ ...prod, VERCEL: '1', ...integration }), [0, 0], 'Vercel + интеграция — чисто');
assert.deepEqual(count({ ...prod, VERCEL: '1' }), [1, 0], 'Vercel без Supabase — ошибка: файлы в /tmp теряются');
assert.deepEqual(count({ ...prod, VERCEL: '1', SUPABASE_URL: 'https://project.supabase.co' }), [1, 0], 'Vercel с URL, но без service role — ошибка');

// Прод 2026-09-15: в ASHYQ_SUPABASE_URL попал токен Telegram — ошибка понятная и без значения
const leaked = '8834231251:AAH-test-token';
const misplaced = checkEnv({ ...prod, VERCEL: '1', ...integration, ASHYQ_SUPABASE_URL: leaked });
assert.equal(misplaced.errors.length, 1, 'не-URL в адресе Supabase — ошибка');
assert.ok(!JSON.stringify(misplaced).includes(leaked), 'значение переменной не попадает в отчёт и логи');

(async () => {
  // Проверка Supabase-хранилища заявок: сеть подменяем, CI без Supabase
  const reply = (status: number) => (async () => new Response('[]', { status })) as unknown as typeof fetch;
  assert.equal(await checkSupabaseLeads('https://p.supabase.co/', 'service', reply(200)), null, 'crm_leads отвечает — хранилище готово');
  assert.match((await checkSupabaseLeads('https://p.supabase.co', 'anon', reply(401))) ?? '', /service_role/, 'чужой ключ — ошибка про service_role');
  assert.match((await checkSupabaseLeads('https://p.supabase.co', 'service', reply(404))) ?? '', /миграции/, 'нет таблицы — ошибка про миграции');
  const offline = (async () => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch;
  assert.match((await checkSupabaseLeads('https://p.supabase.co', 'service', offline)) ?? '', /недоступен/, 'нет сети — ошибка');
  const secretInUrl = (async () => { throw new TypeError('Failed to parse URL from 8834231251:AAH-secret/rest/v1/crm_leads'); }) as unknown as typeof fetch;
  assert.ok(!((await checkSupabaseLeads('https://p.supabase.co', 'service', secretInUrl)) ?? '').includes('AAH-secret'), 'текст ошибки fetch с адресом не попадает в лог');

  const temp = await mkdtemp(path.join(tmpdir(), 'ashyq-env-'));
  try {
    assert.equal(await checkLeadsDir(path.join(temp, 'leads', 'nested')), null, 'папка заявок создаётся');
    const file = path.join(temp, 'not-a-dir');
    await writeFile(file, '');
    assert.match((await checkLeadsDir(path.join(file, 'leads'))) ?? '', /недоступна для записи/, 'недоступная папка — ошибка');
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  console.log('PASS env check: prod config, CI defaults, weak key, http webhook, half Telegram, Supabase provider, leads dir');
})();

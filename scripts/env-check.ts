// Самопроверка src/lib/env.ts (DEPLOY-PREP-001): npx tsx scripts/env-check.ts
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkEnv, checkLeadsDir } from '../src/lib/env';

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

(async () => {
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

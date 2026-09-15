// Самопроверка входа в CRM аккаунтом Supabase (CRM-PROD-001): npx tsx scripts/crm-staff-check.ts
import assert from 'node:assert/strict';
import { isSupabaseStaffRequest } from '../src/lib/supabase-staff-auth';

const adminKey = 'k'.repeat(64);
const env = { ASHYQ_SUPABASE_URL: 'https://p.supabase.co', ASHYQ_SUPABASE_SERVICE_ROLE_KEY: 'service', ASHYQ_ADMIN_KEY: adminKey };
const userId = '11111111-1111-4111-8111-111111111111';
let serial = 0;
// у каждого случая свой токен: положительный ответ кэшируется по токену
const jwt = () => `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ${++serial}.sig`;
const request = (token: string) => new Request('https://ashyq.example/api/crm', { headers: { authorization: `Bearer ${token}` } });

// подменный Supabase: /auth/v1/user отвечает userStatus, profiles — роль (null — профиля нет)
function supabase(role: string | null, userStatus = 200, id: string = userId) {
  const calls: { url: string; auth: string }[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, auth: new Headers(init?.headers).get('authorization') ?? '' });
    if (url.endsWith('/auth/v1/user')) return Response.json({ id }, { status: userStatus });
    return Response.json(role ? [{ role }] : []);
  }) as typeof fetch;
  return { impl, calls };
}
const check = (token: string, fake: ReturnType<typeof supabase>, customEnv: Record<string, string | undefined> = env) =>
  isSupabaseStaffRequest(request(token), customEnv, fake.impl);

(async () => {
  const manager = supabase('manager');
  const managerToken = jwt();
  assert.equal(await check(managerToken, manager), true, 'manager пускается');
  assert.deepEqual(manager.calls.map((call) => call.url), ['https://p.supabase.co/auth/v1/user', `https://p.supabase.co/rest/v1/profiles?select=role&id=eq.${userId}`], 'токен проверяется в Auth, роль — в profiles');
  assert.equal(manager.calls[0].auth, `Bearer ${managerToken}`, 'в Auth уходит токен пользователя');
  assert.equal(manager.calls[1].auth, 'Bearer service', 'profiles читается service role');
  assert.equal(await check(managerToken, manager), true, 'повтор из кэша');
  assert.equal(manager.calls.length, 2, 'кэш не ходит в Supabase');

  assert.equal(await check(jwt(), supabase('admin')), true, 'admin пускается');
  assert.equal(await check(jwt(), supabase('student')), false, 'student — нет');
  assert.equal(await check(jwt(), supabase('teacher')), false, 'teacher — нет');
  assert.equal(await check(jwt(), supabase(null)), false, 'нет профиля — нет');

  const expired = supabase('manager', 401);
  assert.equal(await check(jwt(), expired), false, 'Auth отклонил токен');
  assert.equal(expired.calls.length, 1, 'после отказа Auth роль не читаем');
  assert.equal(await check(jwt(), supabase('manager', 200, '1 or 1=1')), false, 'id не UUID — в запрос не подставляем');

  const offline = (async () => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch;
  assert.equal(await isSupabaseStaffRequest(request(jwt()), env, offline), false, 'Supabase недоступен — не пускаем');

  const spy = supabase('manager');
  assert.equal(await check(adminKey, spy), false, 'ключ админа — не токен Supabase');
  assert.equal(await check('eyJ.admin.key', spy, { ...env, ASHYQ_ADMIN_KEY: 'eyJ.admin.key' }), false, 'даже похожий на JWT ключ админа');
  assert.equal(await check('not-a-jwt', spy), false, 'не JWT');
  assert.equal(await isSupabaseStaffRequest(new Request('https://ashyq.example/api/crm'), env, spy.impl), false, 'без заголовка');
  assert.equal(await check(jwt(), spy, { ASHYQ_ADMIN_KEY: adminKey }), false, 'Supabase не настроен');
  assert.equal(spy.calls.length, 0, 'ключ админа и чужие строки в Supabase не уходят');

  console.log('PASS crm-staff check: manager/admin, student/teacher/no profile, bad token, offline, admin key never sent');
})();

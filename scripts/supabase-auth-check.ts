// Интеграционная проверка SupabaseAuth против локального Supabase (SUPABASE-AUTH-001).
// Нужен запущенный стек: npx supabase@2.117.0 start. Запуск: npx tsx scripts/supabase-auth-check.ts
// Адрес и anon-ключ — из `supabase status -o env` (по умолчанию локальные значения CLI).
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { SupabaseAuth } from '../src/lib/lms/supabase-auth';

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!ANON) throw new Error('SUPABASE_ANON_KEY не задан: возьмите ANON_KEY из `npx supabase@2.117.0 status -o env`');

const run = Date.now();
const email = (tag: string) => `auth-check-${tag}-${run}@example.test`;
const fresh = () => new SupabaseAuth(createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } }));
const created: string[] = [];

(async () => {
  try {
    // 1. Регистрация взрослого: роль student, даже если UI попросит другую
    const adult = fresh();
    const session = await adult.signUp('Айгерим', email('adult'), 'password-123', 'teacher');
    created.push(session.user.id);
    assert.equal(session.user.role, 'student', 'новый аккаунт — student, роль выдаёт только админ');
    assert.equal(session.user.name, 'Айгерим');
    assert.equal(adult.isReady(), true);

    // 2. Выход и повторный вход; неверный пароль — понятная ошибка
    await adult.signOut();
    assert.equal(adult.getSession(), null, 'после выхода сессии нет');
    await assert.rejects(adult.signIn(email('adult'), 'wrong-password'), /Неверный email или пароль/);
    assert.equal((await adult.signIn(email('adult'), 'password-123')).user.email, email('adult'));

    // 2a. Ссылка на CRM в кабинете — только admin/manager (CABINET-CRM-LINK-001)
    assert.equal(adult.getSession()?.user.crm, false, 'у ученика нет ссылки на CRM');
    if (SERVICE) {
      await createClient(URL, SERVICE, { auth: { persistSession: false } }).from('profiles').update({ role: 'admin' }).eq('id', session.user.id);
      await adult.signOut();
      assert.equal((await adult.signIn(email('adult'), 'password-123')).user.crm, true, 'админ видит ссылку на CRM');
    }

    // 3. Короткий пароль и повторный email отсекаются
    await assert.rejects(fresh().signUp('Коротко', email('short'), '1234567'), /минимум 8/);
    await assert.rejects(fresh().signUp('Повтор', email('adult'), 'password-123'), /уже зарегистрирован|Неверный|существ/i);

    // 4. Несовершеннолетний: без согласия отказ и в клиенте, и в БД; с согласием — student
    await assert.rejects(fresh().signUp('Школьник', email('minor'), 'password-123', undefined, { minor: true, guardianConsent: false }), /согласие родителя/);
    const bypass = await createClient(URL, ANON, { auth: { persistSession: false } }).auth.signUp({
      email: email('bypass'),
      password: 'password-123',
      options: { data: { name: 'Обход', is_minor: true } },
    });
    assert.ok(bypass.error, 'БД не создаёт несовершеннолетнего без согласия, даже в обход клиента');
    const minor = await fresh().signUp('Школьник', email('minor'), 'password-123', undefined, { minor: true, guardianConsent: true });
    created.push(minor.user.id);
    assert.equal(minor.user.role, 'student');

    // 5. Отметка о согласии не читается через API
    const client = createClient(URL, ANON, { auth: { persistSession: false } });
    await client.auth.signInWithPassword({ email: email('minor'), password: 'password-123' });
    const consents = await client.schema('private').from('signup_consents').select('*');
    assert.ok(consents.error || (consents.data ?? []).length === 0, 'согласия недоступны через API');

    console.log('PASS supabase auth: student by default, sign-in/out, wrong password, short password, duplicate email, guardian consent (client + DB), private consents');
  } finally {
    if (SERVICE) {
      const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
      for (const id of created) await admin.auth.admin.deleteUser(id);
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

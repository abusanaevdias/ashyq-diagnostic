// Интеграционная проверка файлов LMS в Supabase Storage (SUPABASE-FILES-001).
// Нужен стек `npx supabase@2.117.0 start`; ключи — из `supabase status -o env`:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
import assert from 'node:assert/strict';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseFileStorage } from '../src/lib/lms/supabase-files';
import { createSupabaseRepos } from '../src/lib/lms/supabase-repos';

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!ANON || !SERVICE) throw new Error('Нужны SUPABASE_ANON_KEY и SUPABASE_SERVICE_ROLE_KEY из `npx supabase@2.117.0 status -o env`');

const run = Date.now();
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const created: string[] = [];

async function account(tag: string, role: 'student' | 'teacher'): Promise<{ id: string; client: SupabaseClient }> {
  const email = `files-check-${tag}-${run}@example.test`;
  const made = await admin.auth.admin.createUser({ email, password: 'password-123', email_confirm: true, user_metadata: { name: tag } });
  if (made.error || !made.data.user) throw made.error ?? new Error('createUser failed');
  created.push(made.data.user.id);
  if (role === 'teacher') {
    const { error } = await admin.from('profiles').update({ role }).eq('id', made.data.user.id);
    if (error) throw error;
  }
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const signed = await client.auth.signInWithPassword({ email, password: 'password-123' });
  if (signed.error) throw signed.error;
  return { id: made.data.user.id, client };
}

const file = (name: string, text: string) => new File([text], name, { type: 'text/plain' });

(async () => {
  try {
    const teacher = await account('teacher', 'teacher');
    const student = await account('student', 'student');
    const outsider = await account('outsider', 'student');
    const tFiles = createSupabaseFileStorage(() => teacher.client);
    const sFiles = createSupabaseFileStorage(() => student.client);
    const oFiles = createSupabaseFileStorage(() => outsider.client);

    // Учитель и ученик — в одном классе
    const cls = await createSupabaseRepos(() => teacher.client).classes.create({ title: 'SAT Math', subject: 'SAT', teacherId: teacher.id });
    await createSupabaseRepos(() => student.client).classes.join(cls.inviteCode, student.id);

    // 1. Ученик прикрепляет файл к сдаче — учитель его класса скачивает по подписанной ссылке
    const essay = await sFiles.upload(file('Эссе Task 2.txt', 'Итоговое эссе'));
    assert.match(essay.url ?? '', new RegExp(`^sb-file:${student.id}/`), 'файл в папке ученика');
    const teacherUrl = await tFiles.resolveUrl(essay);
    assert.ok(teacherUrl, 'учитель получает ссылку на файл ученика');
    assert.equal(await (await fetch(teacherUrl!)).text(), 'Итоговое эссе');

    // 2. Материал урока учителя доступен ученику класса
    const material = await tFiles.upload(file('formulas.txt', 'y = mx + b'));
    assert.ok(await sFiles.resolveUrl(material), 'ученик получает материал своего учителя');

    // 3. Посторонний не получает ссылку ни на сдачу, ни на материал
    assert.equal(await oFiles.resolveUrl(essay), null, 'посторонний не видит сдачу');
    assert.equal(await oFiles.resolveUrl(material), null, 'посторонний не видит материал');

    // 4. Загрузка в чужую папку запрещена политикой, а не только клиентом
    const foreign = await outsider.client.storage.from('lms-files').upload(`${student.id}/fake.txt`, file('fake.txt', 'x'));
    assert.ok(foreign.error, 'нельзя положить файл в чужую папку');

    // 5. Больше 2 МБ отсекается до загрузки; внешние ссылки не трогаем
    await assert.rejects(sFiles.upload(file('big.txt', 'x'.repeat(2 * 1024 * 1024 + 1))), /больше 2 МБ/);
    assert.equal(await sFiles.resolveUrl({ id: 'l', kind: 'link', title: 'IELTS', url: 'https://ielts.org' }), 'https://ielts.org');

    console.log('PASS supabase files: owner folder upload, teacher↔student signed links, outsider denied, foreign folder denied, 2 MB limit');
  } finally {
    const { data } = await admin.storage.from('lms-files').list('', { limit: 1000 });
    for (const folder of (data ?? []).filter((f) => created.includes(f.name))) {
      const inside = await admin.storage.from('lms-files').list(folder.name, { limit: 1000 });
      await admin.storage.from('lms-files').remove((inside.data ?? []).map((f) => `${folder.name}/${f.name}`));
    }
    await admin.from('classes').delete().in('teacher_id', created);
    for (const id of created) await admin.auth.admin.deleteUser(id);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

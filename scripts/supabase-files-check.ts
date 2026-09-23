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
    const otherTeacher = await account('other-teacher', 'teacher');
    const student = await account('student', 'student');
    const outsider = await account('outsider', 'student');
    const tFiles = createSupabaseFileStorage(() => teacher.client);
    const t2Files = createSupabaseFileStorage(() => otherTeacher.client);
    const sFiles = createSupabaseFileStorage(() => student.client);
    const oFiles = createSupabaseFileStorage(() => outsider.client);
    const teacherRepos = createSupabaseRepos(() => teacher.client);
    const otherTeacherRepos = createSupabaseRepos(() => otherTeacher.client);
    const studentRepos = createSupabaseRepos(() => student.client);
    const outsiderRepos = createSupabaseRepos(() => outsider.client);

    // Две группы одного учителя и соседняя группа второго учителя.
    const clsA = await teacherRepos.classes.create({ title: 'SAT Math A', subject: 'SAT', teacherId: teacher.id });
    const clsB = await teacherRepos.classes.create({ title: 'SAT Math B', subject: 'SAT', teacherId: teacher.id });
    const clsC = await otherTeacherRepos.classes.create({ title: 'IELTS C', subject: 'IELTS', teacherId: otherTeacher.id });
    await studentRepos.classes.join(clsA.inviteCode, student.id);
    await studentRepos.classes.join(clsC.inviteCode, student.id);
    await outsiderRepos.classes.join(clsB.inviteCode, outsider.id);

    // 1. Ученик прикрепляет файл к сдаче — учитель его класса скачивает по подписанной ссылке
    const assignmentA = await teacherRepos.assignments.create({ classId: clsA.id, teacherId: teacher.id, title: 'Essay A', brief: '', dueAt: new Date(Date.now() + 86_400_000).toISOString(), maxPoints: 10 });
    const essayA = await sFiles.upload(file('Эссе A.txt', 'Работа ученика в группе A'));
    assert.match(essayA.url ?? '', new RegExp(`^sb-file:${student.id}/`), 'файл в папке ученика');
    await studentRepos.submissions.submit({ assignmentId: assignmentA.id, studentId: student.id, content: 'Ответ A', attachments: [essayA] });
    const teacherUrl = await tFiles.resolveUrl(essayA);
    assert.ok(teacherUrl, 'учитель получает ссылку на файл ученика из своей группы');
    assert.equal(await (await fetch(teacherUrl!)).text(), 'Работа ученика в группе A');

    // 2. Материал урока учителя доступен ученику класса
    const materialA = await tFiles.upload(file('formulas-a.txt', 'Формулы для группы A'));
    await teacherRepos.lessons.create({ classId: clsA.id, title: 'Формулы A', body: '', materials: [materialA] });
    assert.ok(await sFiles.resolveUrl(materialA), 'ученик получает материал своего класса');

    // 3. Общий учитель не даёт ученику доступ к материалам другого его класса.
    const materialB = await tFiles.upload(file('formulas-b.txt', 'Материал только группы B'));
    await teacherRepos.lessons.create({ classId: clsB.id, title: 'Формулы B', body: '', materials: [materialB] });
    assert.equal(await sFiles.resolveUrl(materialB), null, 'ученик A не видит файл из группы B того же учителя');
    assert.ok(await oFiles.resolveUrl(materialB), 'ученик B видит свой учебный материал');

    // 4. Второй учитель может читать прикреплённую сдачу в своей группе,
    // но первый учитель не получает доступ к файлам ученика из другой группы.
    const assignmentC = await otherTeacherRepos.assignments.create({ classId: clsC.id, teacherId: otherTeacher.id, title: 'Essay C', brief: '', dueAt: new Date(Date.now() + 86_400_000).toISOString(), maxPoints: 10 });
    const essayC = await sFiles.upload(file('Эссе C.txt', 'Работа ученика в группе C'));
    await studentRepos.submissions.submit({ assignmentId: assignmentC.id, studentId: student.id, content: 'Ответ C', attachments: [essayC] });
    assert.ok(await t2Files.resolveUrl(essayC), 'учитель C видит сдачу своего ученика');
    assert.equal(await tFiles.resolveUrl(essayC), null, 'учитель A не видит файл той же ученицы в другой группе');
    assert.equal(await t2Files.resolveUrl(essayA), null, 'учитель C не видит сдачу из группы A');

    // Ученик не может удалить файл, пока он приложен к сдаче.
    const essayAPath = essayA.url!.slice('sb-file:'.length);
    await student.client.storage.from('lms-files').remove([essayAPath]);
    const preserved = await admin.storage.from('lms-files').download(essayAPath);
    assert.ok(preserved.data, 'прикреплённый файл нельзя удалить прямым запросом');

    // 5. Посторонний не получает ссылку, а чужая папка защищена Storage RLS.
    assert.equal(await oFiles.resolveUrl(essayA), null, 'посторонний не видит сдачу');
    assert.equal(await oFiles.resolveUrl(materialA), null, 'посторонний не видит материал');
    const foreign = await outsider.client.storage.from('lms-files').upload(`${student.id}/fake.txt`, file('fake.txt', 'x'));
    assert.ok(foreign.error, 'нельзя положить файл в чужую папку');

    // 6. Больше 2 МБ отсекается до загрузки; внешние ссылки не трогаем.
    await assert.rejects(sFiles.upload(file('big.txt', 'x'.repeat(2 * 1024 * 1024 + 1))), /больше 2 МБ/);
    assert.equal(await sFiles.resolveUrl({ id: 'l', kind: 'link', title: 'IELTS', url: 'https://ielts.org' }), 'https://ielts.org');

    console.log('PASS supabase files: linked teacher↔student files, cross-class denial, referenced-file retention, outsider denial, 2 MB limit');
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

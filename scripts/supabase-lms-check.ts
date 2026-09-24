// Интеграционная проверка LMS-репозиториев поверх локального Supabase (SUPABASE-LMS-001).
// Нужен стек `npx supabase@2.117.0 start`; ключи — из `supabase status -o env`:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (роли учителя/автора выдаёт «админ» — service role).
import assert from 'node:assert/strict';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseRepos } from '../src/lib/lms/supabase-repos';

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!ANON || !SERVICE) throw new Error('Нужны SUPABASE_ANON_KEY и SUPABASE_SERVICE_ROLE_KEY из `npx supabase@2.117.0 status -o env`');

const run = Date.now();
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const created: string[] = [];

async function account(tag: string, role: 'student' | 'teacher' | 'author'): Promise<{ id: string; client: SupabaseClient }> {
  const email = `lms-check-${tag}-${run}@example.test`;
  const made = await admin.auth.admin.createUser({ email, password: 'password-123', email_confirm: true, user_metadata: { name: tag } });
  if (made.error || !made.data.user) throw made.error ?? new Error('createUser failed');
  created.push(made.data.user.id);
  if (role !== 'student') {
    const { error } = await admin.from('profiles').update({ role }).eq('id', made.data.user.id); // так роль выдаёт админ
    if (error) throw error;
  }
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const signed = await client.auth.signInWithPassword({ email, password: 'password-123' });
  if (signed.error) throw signed.error;
  return { id: made.data.user.id, client };
}

(async () => {
  try {
    const teacher = await account('teacher', 'teacher');
    const student = await account('student', 'student');
    const outsider = await account('outsider', 'student');
    const author = await account('author', 'author');
    const t = createSupabaseRepos(() => teacher.client);
    const s = createSupabaseRepos(() => student.client);
    const o = createSupabaseRepos(() => outsider.client);
    const a = createSupabaseRepos(() => author.client);
    const anon = createSupabaseRepos(() => createClient(URL, ANON, { auth: { persistSession: false } }));

    // 1. Учитель создаёт класс, урок и задание; ученик не может создать класс
    const cls = await t.classes.create({ title: 'IELTS 7+', subject: 'IELTS', teacherId: teacher.id });
    assert.equal(cls.teacherId, teacher.id);
    await assert.rejects(s.classes.create({ title: 'Мой класс', subject: 'SAT', teacherId: student.id }), /прав|security/i);
    const lesson = await t.lessons.create({ classId: cls.id, title: 'Reading: T/F/NG', body: 'Главное правило', materials: [{ id: 'l1', kind: 'link', title: 'Формат', url: 'https://ielts.org' }] });
    const task = await t.assignments.create({ classId: cls.id, teacherId: teacher.id, title: 'Эссе Task 2', brief: '250 слов', dueAt: new Date(Date.now() + 86_400_000).toISOString(), maxPoints: 10 });

    // 2. До вступления ученик класс не видит; по коду вступает, видит урок и задание
    assert.equal((await s.classes.listForUser({ id: student.id, name: '', email: '', role: 'student', avatarColor: 'red' })).length, 0);
    await assert.rejects(s.classes.join('WRONG123', student.id), /не найден/);
    const joined = await s.classes.join(cls.inviteCode.toLowerCase(), student.id);
    assert.ok(joined.memberIds.includes(student.id), 'ученик в составе класса');
    assert.equal((await s.lessons.listByClass(cls.id)).length, 1);
    assert.equal((await s.assignments.listByClass(cls.id)).length, 1);

    // 2a. Самооценка урока: upsert заменяет оценку, учитель видит, посторонний не оценивает
    await s.lessonRatings.rate({ lessonId: lesson.id, studentId: student.id, level: 3 });
    await s.lessonRatings.rate({ lessonId: lesson.id, studentId: student.id, level: 2 });
    assert.deepEqual((await t.lessonRatings.listByLessons([lesson.id])).map((r) => r.level), [2]);
    await assert.rejects(o.lessonRatings.rate({ lessonId: lesson.id, studentId: outsider.id, level: 1 }), /прав|security/i);

    // 3. Сдача, повторная сдача до оценки, комментарии учителя и ученика
    await assert.rejects(s.submissions.submit({ assignmentId: task.id, studentId: student.id, content: ' ', attachments: [] }), /Добавьте ответ/);
    const first = await s.submissions.submit({ assignmentId: task.id, studentId: student.id, content: 'Черновик', attachments: [] });
    const second = await s.submissions.submit({ assignmentId: task.id, studentId: student.id, content: 'Итоговое эссе', attachments: [] });
    assert.equal(second.id, first.id, 'повторная сдача обновляет ту же запись');
    await t.comments.create({ submissionId: second.id, authorId: teacher.id, authorRole: 'teacher', body: 'Добавь пример' });
    await s.comments.create({ submissionId: second.id, authorId: student.id, authorRole: 'student', body: 'Спасибо!' });
    assert.equal((await s.comments.listBySubmission(second.id)).length, 2);

    // 4. Посторонний не видит ни класс, ни сдачу, ни тред; ученик не ставит оценку себе
    assert.equal(await o.classes.get(cls.id), null);
    assert.equal(await o.submissions.get(second.id), null);
    assert.equal((await o.comments.listBySubmission(second.id)).length, 0);
    await assert.rejects(s.submissions.grade(second.id, 10, 10), /не найдена|прав/);

    // 5. Учитель оценивает; после оценки сдачу не изменить; вне диапазона — отказ
    await assert.rejects(t.submissions.grade(second.id, 11, 10), /целое число от 0 до 10/);
    const graded = await t.submissions.grade(second.id, 8, 10);
    assert.equal(graded.status, 'graded');
    assert.equal(graded.grade, 8);
    await assert.rejects(s.submissions.submit({ assignmentId: task.id, studentId: student.id, content: 'Правка', attachments: [] }), /уже оценена/);

    // 6. Блог: пока своих постов нет — демо-статьи; автор пишет и публикует; черновик скрыт
    const draft = await a.blog.createDraft(author.id);
    await assert.rejects(a.blog.publish(draft.id), /без текста/);
    const saved = await a.blog.save({ ...draft, title: 'Қазақша: IELTS кеңестері', body: 'Текст статьи' });
    assert.match(saved.slug, /^qazaqsha-ielts-kenesteri/);
    assert.equal(await anon.blog.getPublishedBySlug(saved.slug), null, 'черновик не виден анониму');
    await assert.rejects(s.blog.createDraft(student.id), /прав|security/i);
    await a.blog.publish(saved.id);
    assert.equal((await anon.blog.getPublishedBySlug(saved.slug))?.title, 'Қазақша: IELTS кеңестері');
    assert.ok((await anon.blog.listPublished()).some((p) => p.id === saved.id), 'опубликованный пост в ленте');
    assert.ok(await anon.blog.getPublishedBySlug('ielts-writing-task-2'), 'статья из кода остаётся доступна');
    await a.blog.unpublish(saved.id);

    // 7. Профили: имя и роль видны вошедшим, email — нет
    const profile = await s.users.get(teacher.id);
    assert.equal(profile?.role, 'teacher');
    assert.equal(profile?.email, '');

    console.log('PASS supabase lms: teacher/student/outsider/author/anon — classes, invite join, lessons, assignments, submit/resubmit, comments, RLS isolation, grading RPC, blog draft/publish');
  } finally {
    await admin.from('blog_posts').delete().in('author_id', created);
    await admin.from('classes').delete().in('teacher_id', created);
    for (const id of created) await admin.auth.admin.deleteUser(id);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

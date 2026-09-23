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
    const otherTeacher = await account('other-teacher', 'teacher');
    const author = await account('author', 'author');
    const t = createSupabaseRepos(() => teacher.client);
    const s = createSupabaseRepos(() => student.client);
    const o = createSupabaseRepos(() => outsider.client);
    const t2 = createSupabaseRepos(() => otherTeacher.client);
    const a = createSupabaseRepos(() => author.client);
    const anon = createSupabaseRepos(() => createClient(URL, ANON, { auth: { persistSession: false } }));

    // 1. Учитель создаёт класс, урок и задание; ученик не может создать класс
    const cls = await t.classes.create({ title: 'IELTS 7+', subject: 'IELTS', teacherId: teacher.id });
    const otherClass = await t2.classes.create({ title: 'SAT Math', subject: 'SAT', teacherId: otherTeacher.id });
    assert.equal(cls.teacherId, teacher.id);
    await assert.rejects(s.classes.create({ title: 'Мой класс', subject: 'SAT', teacherId: student.id }), /прав|security/i);
    const lesson = await t.lessons.create({ classId: cls.id, title: 'Reading: T/F/NG', body: 'Главное правило', materials: [{ id: 'l1', kind: 'link', title: 'Формат', url: 'https://ielts.org' }] });
    const task = await t.assignments.create({ classId: cls.id, teacherId: teacher.id, title: 'Эссе Task 2', brief: '250 слов', dueAt: new Date(Date.now() + 86_400_000).toISOString(), maxPoints: 10 });
    const otherTask = await t2.assignments.create({ classId: otherClass.id, teacherId: otherTeacher.id, title: 'SAT practice', brief: 'Solve the set', dueAt: new Date(Date.now() + 86_400_000).toISOString(), maxPoints: 10 });

    // 2. До вступления ученик класс не видит; по коду вступает, видит урок и задание
    assert.equal((await s.classes.listForUser({ id: student.id, name: '', email: '', role: 'student', avatarColor: 'red' })).length, 0);
    await assert.rejects(s.classes.join('WRONG123', student.id), /не найден/);
    const joined = await s.classes.join(cls.inviteCode.toLowerCase(), student.id);
    assert.ok(joined.memberIds.includes(student.id), 'ученик в составе класса');
    await o.classes.join(otherClass.inviteCode, outsider.id);
    assert.equal((await s.lessons.listByClass(cls.id)).length, 1);
    assert.equal((await s.assignments.listByClass(cls.id)).length, 1);
    const otherSubmission = await o.submissions.submit({ assignmentId: otherTask.id, studentId: outsider.id, content: 'Different group answer', attachments: [] });
    await t2.comments.create({ submissionId: otherSubmission.id, authorId: otherTeacher.id, authorRole: 'teacher', body: 'Group B feedback' });

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
    assert.equal(await t.classes.get(otherClass.id), null);
    assert.equal(await t.submissions.get(otherSubmission.id), null);
    assert.equal((await t.comments.listBySubmission(otherSubmission.id)).length, 0);
    assert.equal(await o.users.get(teacher.id), null, 'чужая группа не раскрывает профиль учителя');
    assert.equal(await s.users.get(otherTeacher.id), null, 'ученик не может перечислять учителей других групп');
    assert.equal((await t.users.get(student.id))?.name, 'student', 'учитель видит профиль своего ученика');
    assert.equal((await s.users.get(teacher.id))?.name, 'teacher', 'ученик видит профиль своего учителя');
    assert.equal((await s.users.get(teacher.id))?.role, 'teacher', 'роль учителя доступна участнику его класса');
    await assert.rejects(s.submissions.grade(second.id, 10, 10), /не найдена|прав/);
    await assert.rejects(t.submissions.grade(otherSubmission.id, 10, 10), /не найдена|прав/);

    // 5. Учитель оценивает; после оценки сдачу не изменить; вне диапазона — отказ
    await assert.rejects(t.submissions.grade(second.id, 11, 10), /целое число от 0 до 10/);
    const graded = await t.submissions.grade(second.id, 8, 10);
    assert.equal(graded.status, 'graded');
    assert.equal(graded.grade, 8);
    await assert.rejects(s.submissions.submit({ assignmentId: task.id, studentId: student.id, content: 'Правка', attachments: [] }), /уже оценена/);

    // Роль администратора в LMS соответствует учителю; понижение роли отзывает прежние права.
    const elevated = await admin.from('profiles').update({ role: 'admin' }).eq('id', teacher.id);
    if (elevated.error) throw elevated.error;
    await t.comments.create({ submissionId: second.id, authorId: teacher.id, authorRole: 'teacher', body: 'Проверка админом' });
    const demoted = await admin.from('profiles').update({ role: 'student' }).eq('id', teacher.id);
    if (demoted.error) throw demoted.error;
    assert.equal(await t.classes.get(cls.id), null, 'пониженный учитель теряет доступ к старому классу');
    assert.equal((await t.classes.listForUser({ id: teacher.id, name: '', email: '', role: 'teacher', avatarColor: 'red' })).length, 0);

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
    assert.ok(await anon.blog.getPublishedBySlug('ielts-true-false-not-given'), 'демо-статьи из кода остаются доступны');
    await a.blog.unpublish(saved.id);

    // 7. Пониженный учитель сохраняет доступ только к собственному профилю.
    const ownProfile = await t.users.get(teacher.id);
    assert.equal(ownProfile?.role, 'student');
    assert.equal(ownProfile?.email, '');
    assert.equal((await s.users.get(teacher.id))?.role, 'student', 'в прежнем классе видна только актуальная роль пользователя');

    console.log('PASS supabase lms: two teachers/two students/author/anon — class invites, scoped profiles and results, grading/comment access, role revocation, blog draft/publish');
  } finally {
    await admin.from('blog_posts').delete().in('author_id', created);
    await admin.from('classes').delete().in('teacher_id', created);
    for (const id of created) await admin.auth.admin.deleteUser(id);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

import assert from 'node:assert/strict';
import { getAuth } from '../src/lib/lms/auth';
import { demoFileStorage, FILE_LIMIT_BYTES } from '../src/lib/lms/files';
import { can, canEditPost, canManageClass, canSubmit, canUseThread, canViewClass, isAshyqStudent, PERMISSIONS, type Action } from '../src/lib/lms/permissions';
import { getRepos } from '../src/lib/lms/repos';
import { applyDemoSeed, DEMO_EMAILS, DEMO_PASSWORD } from '../src/lib/lms/seed';
import { createSupabaseRepos } from '../src/lib/lms/supabase-repos';
import { storageAvailable } from '../src/lib/lms/store';
import type { Role } from '../src/lib/lms/types';

/**
 * Проверки слоя данных LMS без браузера. В Node нет localStorage — это
 * заодно проверяет режим «данные не сохраняются» (память вкладки).
 * Запуск: npx tsx scripts/lms-unit-check.ts
 */

async function main() {
  // 1. Матрица прав = таблица из ТЗ
  const table: Record<Action, Role[]> = {
    'classes.view': ['student', 'teacher'],
    'submission.create': ['student'],
    'submission.commentOwn': ['student'],
    'content.create': ['teacher'],
    'submission.review': ['teacher'],
    'blog.write': ['author'],
    'season.manage': ['teacher'],
    'season.play': ['student'],
  };
  for (const [action, roles] of Object.entries(table) as Array<[Action, Role[]]>) {
    for (const role of ['student', 'teacher', 'author'] as Role[]) {
      assert.equal(can(role, action), roles.includes(role), `${role} × ${action}`);
    }
  }
  assert.equal(can(null, 'classes.view'), false);
  assert.equal(Object.keys(PERMISSIONS).length, Object.keys(table).length);

  // 2. Без localStorage всё работает в памяти
  assert.equal(storageAvailable(), false);

  // 3. Сид + вход
  applyDemoSeed();
  const auth = getAuth();
  await assert.rejects(auth.signIn(DEMO_EMAILS.student, 'wrong'), /Неверный email или пароль/);
  const student = (await auth.signIn(DEMO_EMAILS.student, DEMO_PASSWORD)).user;
  const teacher = (await auth.signIn(DEMO_EMAILS.teacher, DEMO_PASSWORD)).user;
  const author = (await auth.signIn(DEMO_EMAILS.author, DEMO_PASSWORD)).user;
  assert.equal(auth.getSession()?.user.id, author.id);
  await auth.signOut();
  assert.equal(auth.getSession(), null);

  const repos = getRepos();
  const [cls] = await repos.classes.listForUser(student);
  assert(cls && canViewClass(student, cls) && canSubmit(student, cls));
  assert(canManageClass(teacher, cls) && !canManageClass(student, cls) && !canViewClass(author, cls));
  // Основные уроки курса: ученик класса — да, зарегистрированный без класса — нет, сотрудники — да
  assert(isAshyqStudent(student, [cls]) && !isAshyqStudent({ ...student, id: 'guest' }, [cls]) && !isAshyqStudent(student, []));
  assert(isAshyqStudent(teacher, []) && isAshyqStudent(author, []));
  // Класс можно переименовать — код приглашения и состав не меняются; своё имя тоже (EDIT-MORE-001)
  const renamed = await repos.classes.update(cls.id, { title: `${cls.title} (исправлено)`, subject: cls.subject });
  assert.equal(renamed.title, `${cls.title} (исправлено)`);
  assert.equal(renamed.inviteCode, cls.inviteCode);
  assert.deepEqual(renamed.memberIds, cls.memberIds);
  await assert.rejects(repos.classes.update(cls.id, { title: ' ', subject: 'IELTS' }), /название класса/);
  await auth.signIn(DEMO_EMAILS.student, DEMO_PASSWORD);
  assert.equal((await auth.updateName('  Dias K.  ')).user.name, 'Dias K.');
  assert.equal((await repos.users.get(student.id))?.name, 'Dias K.', 'новое имя видно в классе');
  await assert.rejects(auth.updateName(' '), /Укажите имя/);
  await auth.signOut();
  await assert.rejects(auth.updateName('X'), /Войдите/);

  // 4. Учитель создаёт задание → студент видит его в классе
  const task = await repos.assignments.create({ classId: cls.id, teacherId: teacher.id, title: 'Unit task', brief: 'b', dueAt: '2026-01-01T10:00:00Z', maxPoints: 5 });
  assert((await repos.assignments.listByClass(cls.id)).some((a) => a.id === task.id));
  // Урок: ссылка-материал только http(s) — javascript: в href не попадёт
  const link = (url: string) => [{ id: 'm1', kind: 'link' as const, title: 'x', url }];
  await assert.rejects(repos.lessons.create({ classId: cls.id, title: 'L', body: '', materials: link('javascript:alert(1)') }), /http/);
  const lesson = await repos.lessons.create({ classId: cls.id, title: 'L', body: '', materials: link('https://ielts.org') });
  assert.equal(lesson.materials.length, 1);
  // Самооценка урока: повторная оценка заменяет прежнюю, уровни только 1–4
  await repos.lessonRatings.rate({ lessonId: lesson.id, studentId: student.id, level: 3 });
  await repos.lessonRatings.rate({ lessonId: lesson.id, studentId: student.id, level: 1 });
  assert.deepEqual((await repos.lessonRatings.listByLessons([lesson.id])).map((r) => r.level), [1]);
  await assert.rejects(repos.lessonRatings.rate({ lessonId: lesson.id, studentId: student.id, level: 5 as 1 }), /вариант/);
  // Созданный урок можно открыть, исправить (дата публикации не меняется) и удалить (LESSON-EDIT-001)
  assert.equal((await repos.lessons.get(lesson.id))?.title, 'L');
  const fixed = await repos.lessons.update(lesson.id, { title: 'L исправлен', body: 'текст', materials: [] });
  assert.equal(fixed.title, 'L исправлен');
  assert.equal(fixed.publishedAt, lesson.publishedAt);
  await assert.rejects(repos.lessons.update(lesson.id, { title: ' ', body: '', materials: [] }), /тему урока/);
  await repos.lessons.remove(lesson.id);
  assert.equal(await repos.lessons.get(lesson.id), null);
  assert.deepEqual(await repos.lessonRatings.listByLessons([lesson.id]), [], 'оценки удалённого урока тоже удалены');

  // 5. Сдача после дедлайна разрешена; тред; оценка
  await assert.rejects(repos.submissions.submit({ assignmentId: task.id, studentId: student.id, content: ' ', attachments: [] }), /Добавьте ответ/);
  const sub = await repos.submissions.submit({ assignmentId: task.id, studentId: student.id, content: 'answer', attachments: [] });
  assert(canUseThread(student, sub, cls) && canUseThread(teacher, sub, cls) && !canUseThread(author, sub, cls));
  await repos.comments.create({ submissionId: sub.id, authorId: teacher.id, authorRole: 'teacher', body: 'ok' });
  assert.equal((await repos.comments.listBySubmission(sub.id)).length, 1);
  await assert.rejects(repos.submissions.grade(sub.id, 6, 5), /от 0 до 5/);
  const graded = await repos.submissions.grade(sub.id, 4, 5);
  assert.equal(graded.status, 'graded');
  assert.equal(sub.status, 'submitted', 'мутации не меняют старые объекты');
  await assert.rejects(repos.submissions.submit({ assignmentId: task.id, studentId: student.id, content: 'again', attachments: [] }), /уже оценена/);
  // Задание можно исправить, но максимум баллов — не ниже выставленной оценки 4 (LESSON-EDIT-001)
  await assert.rejects(repos.assignments.update(task.id, { title: 'Unit task', brief: 'b', dueAt: task.dueAt, maxPoints: 3 }), /оценка 4/);
  const edited = await repos.assignments.update(task.id, { title: 'Unit task 2', brief: 'b2', dueAt: task.dueAt, maxPoints: 10 });
  assert.equal(edited.title, 'Unit task 2');
  assert.equal(edited.maxPoints, 10);
  assert.equal(edited.createdAt, task.createdAt);

  // 6. Блог: черновик не публичен, публикация, снятие
  const published = await repos.blog.listPublished();
  assert(published.some((p) => p.slug === 'match-day-speaking-battle'));
  assert(!published.some((p) => p.status === 'draft'));
  const draft = await repos.blog.createDraft(author.id);
  assert(canEditPost(author, draft) && !canEditPost(teacher, draft));
  await assert.rejects(repos.blog.publish(draft.id), /без текста/);
  const saved = await repos.blog.save({ ...draft, title: 'Қазақша тест: пост', body: 'Текст' });
  assert.equal(saved.slug, 'qazaqsha-test-post');
  await repos.blog.publish(saved.id);
  assert.equal((await repos.blog.getPublishedBySlug('qazaqsha-test-post'))?.title, 'Қазақша тест: пост');
  await repos.blog.unpublish(saved.id);
  assert.equal(await repos.blog.getPublishedBySlug('qazaqsha-test-post'), null);

  // 7. Файлы: лимит 2 МБ даёт честную ошибку, маленький файл читается обратно
  await assert.rejects(demoFileStorage.upload(new File([new Uint8Array(FILE_LIMIT_BYTES + 1)], 'big.pdf')), /больше 2 МБ/);
  const ref = await demoFileStorage.upload(new File(['hello'], 'note.txt', { type: 'text/plain' }));
  assert.equal(await demoFileStorage.resolveUrl(ref), `data:text/plain;base64,${Buffer.from('hello').toString('base64')}`);

  // 8. Supabase: автор демо-статей `ashyq-team` — не uuid; в базу не ходим, профиля нет (BLOG-AUTHOR-FIX-001)
  const offline = createSupabaseRepos(() => {
    throw new Error('не-uuid id не должен доходить до базы');
  });
  assert.equal(await offline.users.get('ashyq-team'), null);
  assert.deepEqual(await offline.users.listByIds(['ashyq-team']), []);

  // 9. Supabase без таблицы lesson_ratings (миграция не применена): класс грузится без оценок, оценка — понятная ошибка (CLASS-LOAD-FIX-001)
  const missing = { data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.lesson_ratings' in the schema cache" } };
  const query = { select: () => query, in: async () => missing, upsert: () => query, single: async () => missing };
  const noRatingsTable = createSupabaseRepos(() => ({ from: () => query }) as never);
  assert.deepEqual(await noRatingsTable.lessonRatings.listByLessons(['l1']), []);
  await assert.rejects(noRatingsTable.lessonRatings.rate({ lessonId: 'l1', studentId: 's1', level: 2 }), /миграцию/);

  // 10. Ошибка без поля message (тело ответа шлюза/Auth): понятный текст, а не TypeError из humanize (ERROR-SHAPE-FIX-001)
  const bare = (error: object) => createSupabaseRepos(() => ({ from: () => ({ select: () => ({ in: async () => ({ data: null, error }) }) }) }) as never);
  const readable = (pattern: RegExp) => (err: unknown) => err instanceof Error && !(err instanceof TypeError) && pattern.test(err.message);
  await assert.rejects(bare({ code: 401, msg: 'Invalid JWT' }).lessonRatings.listByLessons(['l1']), readable(/^Invalid JWT$/));
  await assert.rejects(bare({ code: 500 }).lessonRatings.listByLessons(['l1']), readable(/код 500/));
  await assert.rejects(bare({}).lessonRatings.listByLessons(['l1']), readable(/Ошибка сервера/));

  console.log('PASS lms unit: permissions matrix, auth, repos, grading, blog publish, file limits, memory mode, non-uuid profiles, missing ratings table, error without message');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

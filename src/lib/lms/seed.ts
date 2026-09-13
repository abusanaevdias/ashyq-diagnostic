import type { Assignment, BlogPost, ClassRoom, Comment, Lesson, Role, Submission } from './types';
import type { DemoAccount } from './auth';
import { upsertDemoAccounts } from './auth';
import { defaultPosts } from './local-repos';
import { lmsBus, newId, writeJson } from './store';

/**
 * Демо-сид (ТЗ LMS-001 §4): кнопка «Заполнить демо-данными» на /login и
 * scripts/seed-demo.ts. Всё содержимое — демонстрационное.
 */

export const DEMO_PASSWORD = 'demo1234';

export const DEMO_EMAILS: Record<Role | 'student2', string> = {
  teacher: 'aigerim@demo.ashyq',
  student: 'dias@demo.ashyq',
  student2: 'mepyat@demo.ashyq',
  author: 'sanzhar@demo.ashyq',
};

export interface DemoSeed {
  accounts: DemoAccount[];
  classes: ClassRoom[];
  lessons: Lesson[];
  assignments: Assignment[];
  submissions: Submission[];
  comments: Comment[];
  posts: BlogPost[];
}

export function buildDemoSeed(now = new Date(), id: () => string = newId): DemoSeed {
  const at = (days: number, hours = 0) => new Date(now.getTime() + (days * 24 + hours) * 3_600_000).toISOString();
  const [teacherId, diasId, mepyatId, authorId] = [id(), id(), id(), id()];
  const classId = id();

  const accounts: DemoAccount[] = [
    { user: { id: teacherId, name: 'Айгерим К.', email: DEMO_EMAILS.teacher, role: 'teacher', avatarColor: 'dark-warm' }, password: DEMO_PASSWORD },
    { user: { id: diasId, name: 'Dias', email: DEMO_EMAILS.student, role: 'student', avatarColor: 'red' }, password: DEMO_PASSWORD },
    { user: { id: mepyatId, name: 'Mepyat', email: DEMO_EMAILS.student2, role: 'student', avatarColor: 'ink' }, password: DEMO_PASSWORD },
    { user: { id: authorId, name: 'Санжар', email: DEMO_EMAILS.author, role: 'author', avatarColor: 'red-deep' }, password: DEMO_PASSWORD },
  ];

  const classes: ClassRoom[] = [
    { id: classId, title: 'IELTS Intermediate · Осень', subject: 'IELTS', teacherId, memberIds: [diasId, mepyatId], inviteCode: 'ASHYQ7', createdAt: at(-21) },
  ];

  const lessons: Lesson[] = [
    {
      id: id(),
      classId,
      title: 'Reading: True / False / Not Given',
      body: '## Главное правило\n\nNot Given — когда текст не подтверждает и не опровергает утверждение.\n\n- Ищите синонимы, а не совпадение слов\n- Не додумывайте за автора\n- Одно слово-ограничитель меняет ответ',
      materials: [
        { id: id(), kind: 'link', title: 'Формат IELTS Reading — официальное описание', url: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading' },
        { id: id(), kind: 'text', title: 'Памятка: слова-ограничители', body: 'all, only, always, never, some, most — если в утверждении есть такое слово, проверьте, есть ли оно в тексте.' },
      ],
      publishedAt: at(-14),
    },
    {
      id: id(),
      classId,
      title: 'Listening: Form completion',
      body: '## Где теряют баллы\n\n- Орфография имён и улиц\n- Числа и даты: 13 и 30\n- Лимит слов в инструкции',
      materials: [
        { id: id(), kind: 'link', title: 'Формат IELTS Listening — официальное описание', url: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening' },
        { id: id(), kind: 'text', title: 'Чек-лист перед ответом', body: 'Прочитайте инструкцию про лимит слов, предскажите тип ответа (число, имя, место), проверьте орфографию.' },
      ],
      publishedAt: at(-7),
    },
  ];

  const essayId = id();
  const readingId = id();
  const assignments: Assignment[] = [
    { id: essayId, classId, teacherId, title: 'Essay Task 2: онлайн-образование', brief: 'Напишите эссе 250+ слов: «Online education will replace traditional schools». Приведите аргументы за и против.', dueAt: at(-2, 18), maxPoints: 10, createdAt: at(-9) },
    { id: readingId, classId, teacherId, title: 'Reading practice: 13 вопросов', brief: 'Пройдите тренировочный Reading-блок и пришлите ответы с пояснением к двум самым сложным вопросам.', dueAt: at(5, 18), maxPoints: 13, createdAt: at(-1) },
  ];

  const diasSubmissionId = id();
  const submissions: Submission[] = [
    { id: diasSubmissionId, assignmentId: essayId, studentId: diasId, content: 'Online education gives flexibility, but schools teach teamwork and discipline…', attachments: [], submittedAt: at(-3), status: 'graded', grade: 8 },
    { id: id(), assignmentId: essayId, studentId: mepyatId, content: 'In my opinion, online learning is effective when students have a clear plan…', attachments: [], submittedAt: at(-1), status: 'submitted' },
  ];

  const comments: Comment[] = [
    { id: id(), submissionId: diasSubmissionId, authorId: teacherId, authorRole: 'teacher', body: 'Хорошая структура и ясная позиция. Добавь пример в третий абзац — это поднимет Task Response.', createdAt: at(-2) },
    { id: id(), submissionId: diasSubmissionId, authorId: diasId, authorRole: 'student', body: 'Спасибо! Перепишу третий абзац с примером про онлайн-курсы.', createdAt: at(-2, 3) },
  ];

  const posts: BlogPost[] = [
    { id: id(), slug: 'match-day-speaking-battle', title: 'Match Day: как готовиться к Speaking Battle', category: 'season', excerpt: 'Три упражнения на неделю до Match Day, чтобы говорить увереннее под таймером.', body: '## Разогрев\n\nЗа неделю до Match Day тренируйте ответы на 2 минуты.\n\n- Запишите себя на диктофон\n- Слушайте паузы, а не ошибки\n- Повторите через день', status: 'published', authorId, publishedAt: at(-4) },
    { id: id(), slug: 'sat-math-linear-equations', title: 'SAT Math: три ошибки в линейных уравнениях', category: 'sat', excerpt: 'Знак при переносе, дроби и лишний шаг — где теряются лёгкие баллы.', body: '## Ошибка 1: знак\n\nПри переносе через знак равенства меняйте знак у каждого слагаемого.\n\n## Ошибка 2: дроби\n\nУмножайте обе части на общий знаменатель сразу.', status: 'published', authorId, publishedAt: at(-2) },
    { id: id(), slug: 'kak-vybrat-datu-ekzamena', title: 'Как выбрать дату экзамена', category: 'ielts', excerpt: 'Черновик: считаем назад от дедлайнов поступления.', body: 'Черновик статьи.', status: 'draft', authorId },
  ];

  return { accounts, classes, lessons, assignments, submissions, comments, posts };
}

/** Перезаписывает учебные коллекции демо-данными; чужие аккаунты не трогает. */
export function applyDemoSeed(seed: DemoSeed = buildDemoSeed()): void {
  upsertDemoAccounts(seed.accounts);
  writeJson('classes', seed.classes);
  writeJson('lessons', seed.lessons);
  writeJson('assignments', seed.assignments);
  writeJson('submissions', seed.submissions);
  writeJson('comments', seed.comments);
  writeJson('posts', [...defaultPosts(), ...seed.posts]);
  lmsBus.emit();
}

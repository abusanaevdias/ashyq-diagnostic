import { BLOG_POSTS } from '@/data/blog';
import type { Assignment, BlogPost, ClassRoom, Comment, Lesson, LessonRating, Submission, User } from './types';
import { isHttpUrl } from './format';
import type { Repos } from './repos';
import { lmsBus, newId, newInviteCode, readJson, writeJson } from './store';

/**
 * LocalDemo-реализация репозиториев поверх localStorage `ashyq:v2:*`.
 * Права здесь НЕ проверяются — это делает UI через permissions.ts; в
 * Supabase то же обеспечат серверные политики (см. TODO ниже).
 */

const nowIso = () => new Date().toISOString();

function collection<T extends { id: string }>(name: string) {
  return {
    all: (): T[] => readJson<T[]>(name, []),
    put(items: T[]): void {
      writeJson(name, items);
      lmsBus.emit();
    },
    upsert(item: T): T {
      const all = readJson<T[]>(name, []);
      const exists = all.some((x) => x.id === item.id);
      this.put(exists ? all.map((x) => (x.id === item.id ? item : x)) : [...all, item]);
      return item;
    },
  };
}

function required(value: string, message: string): string {
  const clean = value.trim();
  if (!clean) throw new Error(message);
  return clean;
}

/** Поля задания проверяются одинаково при создании и правке. */
function assignmentFields(input: { title: string; brief: string; dueAt: string; maxPoints: number }) {
  if (Number.isNaN(Date.parse(input.dueAt))) throw new Error('Укажите дедлайн');
  if (!Number.isInteger(input.maxPoints) || input.maxPoints < 1 || input.maxPoints > 1000) throw new Error('Максимум баллов — целое число от 1 до 1000');
  return { title: required(input.title, 'Укажите название задания'), brief: input.brief.trim(), dueAt: new Date(input.dueAt).toISOString(), maxPoints: input.maxPoints };
}

const classes = collection<ClassRoom>('classes');
const lessons = collection<Lesson>('lessons');
const assignments = collection<Assignment>('assignments');
const submissions = collection<Submission>('submissions');
const comments = collection<Comment>('comments');
const posts = collection<BlogPost>('posts');

/** Хук сезона: оценка → очки/leaderboard. Здесь намеренно пусто. */
export function onGraded(submission: Submission): void {
  // TODO(SEASON-BACKEND-001): начислять очки сезона за оценённые сдачи.
  void submission;
}

/** Первые статьи демо-блога — текущие темы из src/data/blog.ts, пока автор не опубликовал свои. */
export function defaultPosts(): BlogPost[] {
  return BLOG_POSTS.map((p) => ({
    id: `default-${p.slug}`,
    slug: p.slug,
    title: p.title,
    category: p.category,
    excerpt: p.excerpt,
    body: p.body,
    coverUrl: p.photo,
    status: 'published',
    authorId: 'ashyq-team',
    publishedAt: '2026-09-13T00:00:00.000Z',
  }));
}

/** Хвост заглушки, с которой демо-статьи сохранялись в localStorage до BLOG-DRAFTS-001. */
const OLD_STUB = '\n\nПолный текст статьи появится позже.';

function allPosts(): BlogPost[] {
  const stored = readJson<BlogPost[] | null>('posts', null);
  if (!stored) return defaultPosts();
  // сохранённые копии демо-статей с заглушкой получают текст; правки автора не трогаем
  const bodies = new Map(defaultPosts().map((p) => [p.id, p.body]));
  return stored.map((p) => (p.body.endsWith(OLD_STUB) && bodies.has(p.id) ? { ...p, body: bodies.get(p.id)! } : p));
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ә: 'a', ғ: 'g', қ: 'q', ң: 'n', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i',
};

export function slugify(title: string, taken: string[]): string {
  const base =
    title
      .toLowerCase()
      .split('')
      .map((ch) => TRANSLIT[ch] ?? ch)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'post';
  let slug = base;
  for (let i = 2; taken.includes(slug); i += 1) slug = `${base}-${i}`;
  return slug;
}

export const localDemoRepos: Repos = {
  classes: {
    async listForUser(user) {
      return classes.all().filter((c) => (user.role === 'teacher' ? c.teacherId === user.id : c.memberIds.includes(user.id)));
    },
    async get(id) {
      return classes.all().find((c) => c.id === id) ?? null;
    },
    async create({ title, subject, teacherId }) {
      const cls: ClassRoom = {
        id: newId(),
        title: required(title, 'Укажите название класса'),
        subject: required(subject, 'Укажите предмет'),
        teacherId,
        memberIds: [],
        inviteCode: newInviteCode(),
        createdAt: nowIso(),
      };
      return classes.upsert(cls);
    },
    async join(inviteCode, studentId) {
      const code = inviteCode.trim().toUpperCase();
      const found = classes.all().find((c) => c.inviteCode === code);
      if (!found) throw new Error('Класс с таким кодом не найден — проверьте код у учителя.');
      if (found.memberIds.includes(studentId)) return found;
      return classes.upsert({ ...found, memberIds: [...found.memberIds, studentId] });
    },
    async update(id, { title, subject }) {
      // TODO(supabase): серверно проверять, что класс правит его учитель (RLS classes_manage).
      const found = classes.all().find((c) => c.id === id);
      if (!found) throw new Error('Класс не найден');
      return classes.upsert({ ...found, title: required(title, 'Укажите название класса'), subject: required(subject, 'Укажите предмет') });
    },
  },

  lessons: {
    async listByClass(classId) {
      return lessons.all().filter((l) => l.classId === classId).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    },
    async create({ classId, title, body, materials }) {
      // TODO(supabase): серверно проверять, что урок создаёт учитель этого класса.
      if (materials.some((m) => m.kind === 'link' && !isHttpUrl(m.url ?? ''))) throw new Error('Ссылка должна начинаться с http:// или https://');
      return lessons.upsert({
        id: newId(),
        classId,
        title: required(title, 'Укажите тему урока'),
        body: body.trim(),
        materials,
        publishedAt: nowIso(),
      });
    },
    async get(id) {
      return lessons.all().find((l) => l.id === id) ?? null;
    },
    async update(id, { title, body, materials }) {
      // TODO(supabase): серверно проверять, что урок правит учитель этого класса (RLS lessons_manage).
      const found = lessons.all().find((l) => l.id === id);
      if (!found) throw new Error('Урок не найден');
      if (materials.some((m) => m.kind === 'link' && !isHttpUrl(m.url ?? ''))) throw new Error('Ссылка должна начинаться с http:// или https://');
      return lessons.upsert({ ...found, title: required(title, 'Укажите тему урока'), body: body.trim(), materials });
    },
    async remove(id) {
      writeJson('lessonRatings', readJson<LessonRating[]>('lessonRatings', []).filter((r) => r.lessonId !== id));
      lessons.put(lessons.all().filter((l) => l.id !== id));
    },
  },

  lessonRatings: {
    async listByLessons(lessonIds) {
      return readJson<LessonRating[]>('lessonRatings', []).filter((r) => lessonIds.includes(r.lessonId));
    },
    async rate({ lessonId, studentId, level }) {
      // TODO(supabase): серверно проверять, что оценивает ученик этого класса (RLS lesson_ratings_*).
      if (![1, 2, 3, 4].includes(level)) throw new Error('Выберите вариант оценки');
      const rating: LessonRating = { lessonId, studentId, level, ratedAt: nowIso() };
      const others = readJson<LessonRating[]>('lessonRatings', []).filter((r) => r.lessonId !== lessonId || r.studentId !== studentId);
      writeJson('lessonRatings', [...others, rating]);
      lmsBus.emit();
      return rating;
    },
  },

  assignments: {
    async listByClass(classId) {
      return assignments.all().filter((a) => a.classId === classId).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    },
    async get(id) {
      return assignments.all().find((a) => a.id === id) ?? null;
    },
    async create({ classId, teacherId, ...input }) {
      return assignments.upsert({ id: newId(), classId, teacherId, ...assignmentFields(input), createdAt: nowIso() });
    },
    async update(id, input) {
      // TODO(supabase): серверно проверять, что задание правит учитель этого класса (RLS assignments_manage).
      const found = assignments.all().find((a) => a.id === id);
      if (!found) throw new Error('Задание не найдено');
      const fields = assignmentFields(input);
      const top = Math.max(0, ...submissions.all().filter((s) => s.assignmentId === id).map((s) => s.grade ?? 0));
      if (fields.maxPoints < top) throw new Error(`Уже выставлена оценка ${top} — максимум баллов не может быть меньше`);
      return assignments.upsert({ ...found, ...fields });
    },
  },

  submissions: {
    async listByAssignment(assignmentId) {
      return submissions.all().filter((s) => s.assignmentId === assignmentId);
    },
    async listByStudent(studentId) {
      return submissions.all().filter((s) => s.studentId === studentId);
    },
    async get(id) {
      return submissions.all().find((s) => s.id === id) ?? null;
    },
    async getForStudent(assignmentId, studentId) {
      return submissions.all().find((s) => s.assignmentId === assignmentId && s.studentId === studentId) ?? null;
    },
    async submit({ assignmentId, studentId, content, attachments }) {
      // TODO(supabase): серверно проверять членство в классе и владельца сдачи (RLS).
      if (!content.trim() && attachments.length === 0) throw new Error('Добавьте ответ или файл');
      const existing = submissions.all().find((s) => s.assignmentId === assignmentId && s.studentId === studentId);
      if (existing?.status === 'graded') throw new Error('Работа уже оценена — изменить её нельзя');
      // Политика клуба: сдачу после дедлайна не блокируем, UI помечает её «с опозданием».
      return submissions.upsert({
        id: existing?.id ?? newId(),
        assignmentId,
        studentId,
        content: content.trim(),
        attachments,
        submittedAt: nowIso(),
        status: 'submitted',
      });
    },
    async grade(id, grade, maxPoints) {
      // TODO(supabase): серверно проверять, что оценивает учитель этого класса.
      if (!Number.isInteger(grade) || grade < 0 || grade > maxPoints) throw new Error(`Оценка — целое число от 0 до ${maxPoints}`);
      const found = submissions.all().find((s) => s.id === id);
      if (!found) throw new Error('Сдача не найдена');
      const graded = submissions.upsert({ ...found, status: 'graded', grade });
      onGraded(graded);
      return graded;
    },
  },

  comments: {
    async listBySubmission(submissionId) {
      return comments.all().filter((c) => c.submissionId === submissionId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async create({ submissionId, authorId, authorRole, body }) {
      // TODO(supabase): серверно пускать в тред только автора сдачи и учителя класса.
      return comments.upsert({ id: newId(), submissionId, authorId, authorRole, body: required(body, 'Напишите комментарий'), createdAt: nowIso() });
    },
  },

  blog: {
    async listPublished() {
      return allPosts().filter((p) => p.status === 'published').sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    },
    async listByAuthor(authorId) {
      return allPosts().filter((p) => p.authorId === authorId);
    },
    async get(id) {
      return allPosts().find((p) => p.id === id) ?? null;
    },
    async getPublishedBySlug(slug) {
      return allPosts().find((p) => p.slug === slug && p.status === 'published') ?? null;
    },
    async createDraft(authorId) {
      const all = allPosts();
      const draft: BlogPost = { id: newId(), slug: slugify('Новый пост', all.map((p) => p.slug)), title: 'Новый пост', category: 'ielts', excerpt: '', body: '', status: 'draft', authorId };
      posts.put([...all, draft]);
      return draft;
    },
    async save(post) {
      const all = allPosts();
      const others = all.filter((p) => p.id !== post.id).map((p) => p.slug);
      const next: BlogPost = { ...post, title: required(post.title, 'Укажите заголовок'), slug: slugify(post.title, others) };
      posts.put(all.some((p) => p.id === post.id) ? all.map((p) => (p.id === post.id ? next : p)) : [...all, next]);
      return next;
    },
    async publish(id) {
      // TODO(supabase): публиковать может только автор поста — серверная политика.
      const all = allPosts();
      const found = all.find((p) => p.id === id);
      if (!found) throw new Error('Пост не найден');
      if (!found.body.trim()) throw new Error('Нельзя опубликовать пост без текста');
      const next: BlogPost = { ...found, status: 'published', publishedAt: found.publishedAt ?? nowIso() };
      posts.put(all.map((p) => (p.id === id ? next : p)));
      return next;
    },
    async unpublish(id) {
      const all = allPosts();
      const found = all.find((p) => p.id === id);
      if (!found) throw new Error('Пост не найден');
      const next: BlogPost = { ...found, status: 'draft' };
      posts.put(all.map((p) => (p.id === id ? next : p)));
      return next;
    },
  },

  users: {
    async get(id) {
      return readJson<Array<{ user: User }>>('users', []).find((a) => a.user.id === id)?.user ?? null;
    },
    async listByIds(ids) {
      return readJson<Array<{ user: User }>>('users', []).map((a) => a.user).filter((u) => ids.includes(u.id));
    },
  },
};

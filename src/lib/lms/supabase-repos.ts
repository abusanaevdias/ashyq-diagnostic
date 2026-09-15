import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { defaultPosts, slugify } from './local-repos';
import { isHttpUrl } from './format';
import type { Repos } from './repos';
import { lmsBus, newId, newInviteCode } from './store';
import { supabaseBrowser } from './supabase-auth';
import type { Assignment, AvatarColor, BlogPost, ClassRoom, Comment, Lesson, LessonRating, LessonRatingLevel, MaterialRef, Role, Submission, User } from './types';

/**
 * Репозитории учебного слоя поверх таблиц Supabase (SUPABASE-LMS-001).
 * Права проверяют RLS-политики и RPC миграции `20260914000100_foundation.sql`:
 * клиентские проверки ниже — только понятные сообщения до запроса.
 */

type ClassRow = { id: string; title: string; subject: string; teacher_id: string; invite_code: string; created_at: string; class_members?: { student_id: string }[] };
type LessonRow = { id: string; class_id: string; title: string; body: string; materials: MaterialRef[]; published_at: string };
type LessonRatingRow = { lesson_id: string; student_id: string; level: LessonRatingLevel; rated_at: string };
type AssignmentRow = { id: string; class_id: string; teacher_id: string; title: string; brief: string; due_at: string; max_points: number; created_at: string };
type SubmissionRow = { id: string; assignment_id: string; student_id: string; content: string; attachments: MaterialRef[]; submitted_at: string; status: 'submitted' | 'graded'; grade: number | null };
type CommentRow = { id: string; submission_id: string; author_id: string; author_role: Role; body: string; created_at: string };
type PostRow = { id: string; slug: string; title: string; category: string; excerpt: string; body: string; cover_url: string | null; status: 'draft' | 'published'; author_id: string; published_at: string | null };
type ProfileRow = { id: string; display_name: string; role: string; avatar_color: AvatarColor };

const CLASS_COLUMNS = 'id, title, subject, teacher_id, invite_code, created_at, class_members(student_id)';
const ROLES: Record<string, Role> = { student: 'student', teacher: 'teacher', author: 'author', admin: 'teacher' };
/** profiles.id — uuid; не-uuid (автор демо-статей `ashyq-team`) Postgres отвергает 400-й, а профиля у него и нет. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toClass = (row: ClassRow): ClassRoom => ({
  id: row.id,
  title: row.title,
  subject: row.subject,
  teacherId: row.teacher_id,
  memberIds: (row.class_members ?? []).map((m) => m.student_id),
  inviteCode: row.invite_code,
  createdAt: row.created_at,
});
const toLesson = (row: LessonRow): Lesson => ({ id: row.id, classId: row.class_id, title: row.title, body: row.body, materials: row.materials ?? [], publishedAt: row.published_at });
const toLessonRating = (row: LessonRatingRow): LessonRating => ({ lessonId: row.lesson_id, studentId: row.student_id, level: row.level, ratedAt: row.rated_at });
const toAssignment = (row: AssignmentRow): Assignment => ({
  id: row.id,
  classId: row.class_id,
  teacherId: row.teacher_id,
  title: row.title,
  brief: row.brief,
  dueAt: row.due_at,
  maxPoints: row.max_points,
  createdAt: row.created_at,
});
const toSubmission = (row: SubmissionRow): Submission => ({
  id: row.id,
  assignmentId: row.assignment_id,
  studentId: row.student_id,
  content: row.content,
  attachments: row.attachments ?? [],
  submittedAt: row.submitted_at,
  status: row.status,
  ...(row.grade === null ? {} : { grade: row.grade }),
});
const toComment = (row: CommentRow): Comment => ({ id: row.id, submissionId: row.submission_id, authorId: row.author_id, authorRole: row.author_role, body: row.body, createdAt: row.created_at });
const toPost = (row: PostRow): BlogPost => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  category: row.category,
  excerpt: row.excerpt,
  body: row.body,
  ...(row.cover_url ? { coverUrl: row.cover_url } : {}),
  status: row.status,
  authorId: row.author_id,
  ...(row.published_at ? { publishedAt: row.published_at } : {}),
});
const toUser = (row: ProfileRow): User => ({ id: row.id, name: row.display_name, email: '', role: ROLES[row.role] ?? 'student', avatarColor: row.avatar_color });

type DbError = { message?: unknown; msg?: unknown; error_description?: unknown; error?: unknown; code?: unknown };

/** Ошибки БД → сообщения интерфейса (тексты RPC — из миграции). */
function humanize(error: PostgrestError | DbError): string {
  // postgrest-js кладёт в error тело неуспешного ответа как есть: у ответа шлюза или Auth
  // поля message может не быть — текст ищем в известных полях (ERROR-SHAPE-FIX-001)
  const raw = error as DbError;
  const found = [raw.message, raw.msg, raw.error_description, raw.error].find((value) => typeof value === 'string' && value.trim());
  const code = raw.code === undefined || raw.code === null ? '' : String(raw.code);
  const text = typeof found === 'string' ? found : `Ошибка сервера${code ? ` (код ${code})` : ''}. Обновите страницу или попробуйте позже.`;
  if (text.includes('Class not found')) return 'Класс с таким кодом не найден — проверьте код у учителя.';
  if (text.includes('Only students can join')) return 'Вступить в класс по коду может только ученик.';
  if (text.includes('Submission not found')) return 'Сдача не найдена или её оценивает другой учитель.';
  if (text.includes('outside assignment range')) return 'Оценка вне диапазона задания.';
  if (code === '42501' || /row-level security/i.test(text)) return 'Недостаточно прав для этого действия.';
  if (code === 'PGRST205') return 'Эта функция ещё не включена на сервере: администратору нужно применить миграцию базы данных.';
  return text;
}

/** Без сгенерированных типов supabase-js не знает форму строки: вызывающий приводит unknown к своему Row. */
function data(result: { data: unknown; error: PostgrestError | null }, missing = 'Запись не найдена'): unknown {
  if (result.error) throw new Error(humanize(result.error));
  if (result.data === null || result.data === undefined) throw new Error(missing);
  return result.data;
}

function list<T>(result: { data: T[] | null; error: PostgrestError | null }): T[] {
  if (result.error) throw new Error(humanize(result.error));
  return result.data ?? [];
}

function required(value: string, message: string): string {
  const clean = value.trim();
  if (!clean) throw new Error(message);
  return clean;
}

/** Мутация прошла — хуки перечитывают данные, как в демо. */
function changed<T>(value: T): T {
  lmsBus.emit();
  return value;
}

const nowIso = () => new Date().toISOString();

/** Поля задания проверяются одинаково при создании и правке. */
function assignmentFields(input: { title: string; brief: string; dueAt: string; maxPoints: number }) {
  if (Number.isNaN(Date.parse(input.dueAt))) throw new Error('Укажите дедлайн');
  if (!Number.isInteger(input.maxPoints) || input.maxPoints < 1 || input.maxPoints > 1000) throw new Error('Максимум баллов — целое число от 1 до 1000');
  return { title: required(input.title, 'Укажите название задания'), brief: input.brief.trim(), due_at: new Date(input.dueAt).toISOString(), max_points: input.maxPoints };
}

const NOT_YOURS = 'Не найдено или относится к классу другого учителя.';

export function createSupabaseRepos(client: () => SupabaseClient): Repos {
  const db = () => client();

  const classes: Repos['classes'] = {
    async listForUser() {
      // RLS отдаёт ровно те классы, которые пользователь ведёт или в которых учится
      return list(await db().from('classes').select(CLASS_COLUMNS).order('created_at')).map((row) => toClass(row as ClassRow));
    },
    async get(id) {
      const { data: row, error } = await db().from('classes').select(CLASS_COLUMNS).eq('id', id).maybeSingle();
      if (error) throw new Error(humanize(error));
      return row ? toClass(row as ClassRow) : null;
    },
    async create({ title, subject, teacherId }) {
      // Без RETURNING: политика чтения classes проверяет строку функцией, которая
      // в том же запросе ещё не видит новую запись, — читаем класс вторым запросом.
      const id = newId();
      const { error } = await db()
        .from('classes')
        .insert({ id, title: required(title, 'Укажите название класса'), subject: required(subject, 'Укажите предмет'), teacher_id: teacherId, invite_code: newInviteCode(8) });
      if (error) throw new Error(humanize(error));
      const created = await classes.get(id);
      if (!created) throw new Error('Класс не найден');
      return changed(created);
    },
    async join(inviteCode) {
      const id = data(await db().rpc('join_class', { p_invite_code: inviteCode.trim().toUpperCase() })) as string;
      const joined = await classes.get(id);
      if (!joined) throw new Error('Класс не найден');
      return changed(joined);
    },
  };

  const users: Repos['users'] = {
    async get(id) {
      if (!UUID.test(id)) return null;
      const { data: row, error } = await db().from('profiles').select('id, display_name, role, avatar_color').eq('id', id).maybeSingle();
      if (error) throw new Error(humanize(error));
      return row ? toUser(row as ProfileRow) : null;
    },
    async listByIds(all) {
      const ids = all.filter((id) => UUID.test(id));
      if (!ids.length) return [];
      return list(await db().from('profiles').select('id, display_name, role, avatar_color').in('id', ids)).map((row) => toUser(row as ProfileRow));
    },
  };

  const submissions: Repos['submissions'] = {
    async listByAssignment(assignmentId) {
      return list(await db().from('submissions').select('*').eq('assignment_id', assignmentId)).map((row) => toSubmission(row as SubmissionRow));
    },
    async listByStudent(studentId) {
      return list(await db().from('submissions').select('*').eq('student_id', studentId)).map((row) => toSubmission(row as SubmissionRow));
    },
    async get(id) {
      const { data: row, error } = await db().from('submissions').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(humanize(error));
      return row ? toSubmission(row as SubmissionRow) : null;
    },
    async getForStudent(assignmentId, studentId) {
      const { data: row, error } = await db().from('submissions').select('*').eq('assignment_id', assignmentId).eq('student_id', studentId).maybeSingle();
      if (error) throw new Error(humanize(error));
      return row ? toSubmission(row as SubmissionRow) : null;
    },
    async submit({ assignmentId, studentId, content, attachments }) {
      if (!content.trim() && attachments.length === 0) throw new Error('Добавьте ответ или файл');
      const existing = await submissions.getForStudent(assignmentId, studentId);
      if (existing?.status === 'graded') throw new Error('Работа уже оценена — изменить её нельзя');
      // Политика клуба: сдачу после дедлайна не блокируем, UI помечает её «с опозданием».
      const payload = { content: content.trim(), attachments, submitted_at: nowIso() };
      const row = existing
        ? data(await db().from('submissions').update(payload).eq('id', existing.id).select('*').single())
        : data(await db().from('submissions').insert({ ...payload, assignment_id: assignmentId, student_id: studentId }).select('*').single());
      return changed(toSubmission(row as SubmissionRow));
    },
    async grade(id, grade, maxPoints) {
      if (!Number.isInteger(grade) || grade < 0 || grade > maxPoints) throw new Error(`Оценка — целое число от 0 до ${maxPoints}`);
      const row = data(await db().rpc('grade_submission', { p_submission_id: id, p_grade: grade }));
      return changed(toSubmission(row as SubmissionRow));
    },
  };

  /** Демо-статьи из кода видны, пока в базе нет своих опубликованных постов (BLOG_IS_DEMO). */
  const fallbackPosts = () => defaultPosts().filter((p) => p.status === 'published');

  const posts = () => db().from('blog_posts');

  /** slug уникален по всей таблице, а чужие черновики RLS не показывает: при конфликте — суффикс. */
  async function withUniqueSlug(title: string, write: (slug: string) => PromiseLike<{ data: unknown; error: PostgrestError | null }>): Promise<PostRow> {
    const base = slugify(title, []);
    let result = await write(base);
    if (result.error?.code === '23505') result = await write(`${base}-${newInviteCode(4).toLowerCase()}`);
    return data(result) as PostRow;
  }

  const blog: Repos['blog'] = {
    async listPublished() {
      const rows = list(await posts().select('*').eq('status', 'published').order('published_at', { ascending: false }));
      return rows.length ? rows.map((row) => toPost(row as PostRow)) : fallbackPosts();
    },
    async listByAuthor(authorId) {
      return list(await posts().select('*').eq('author_id', authorId).order('created_at', { ascending: false })).map((row) => toPost(row as PostRow));
    },
    async get(id) {
      if (id.startsWith('default-')) return fallbackPosts().find((p) => p.id === id) ?? null;
      const { data: row, error } = await posts().select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(humanize(error));
      return row ? toPost(row as PostRow) : null;
    },
    async getPublishedBySlug(slug) {
      const { data: row, error } = await posts().select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
      if (error) throw new Error(humanize(error));
      return row ? toPost(row as PostRow) : (fallbackPosts().find((p) => p.slug === slug) ?? null);
    },
    async createDraft(authorId) {
      const row = await withUniqueSlug('Новый пост', (slug) =>
        posts().insert({ slug, title: 'Новый пост', category: 'ielts', excerpt: '', body: '', status: 'draft', author_id: authorId }).select('*').single(),
      );
      return changed(toPost(row));
    },
    async save(post) {
      const title = required(post.title, 'Укажите заголовок');
      const row = await withUniqueSlug(title, (slug) =>
        posts()
          .update({ slug, title, category: post.category, excerpt: post.excerpt, body: post.body, cover_url: post.coverUrl ?? null })
          .eq('id', post.id)
          .select('*')
          .single(),
      );
      return changed(toPost(row));
    },
    async publish(id) {
      const found = await blog.get(id);
      if (!found) throw new Error('Пост не найден');
      if (!found.body.trim()) throw new Error('Нельзя опубликовать пост без текста');
      const row = data(await posts().update({ status: 'published', published_at: found.publishedAt ?? nowIso() }).eq('id', id).select('*').single());
      return changed(toPost(row as PostRow));
    },
    async unpublish(id) {
      const row = data(await posts().update({ status: 'draft' }).eq('id', id).select('*').single(), 'Пост не найден');
      return changed(toPost(row as PostRow));
    },
  };

  return {
    classes,
    users,
    submissions,
    blog,
    lessons: {
      async listByClass(classId) {
        return list(await db().from('lessons').select('*').eq('class_id', classId).order('published_at', { ascending: false })).map((row) => toLesson(row as LessonRow));
      },
      async create({ classId, title, body, materials }) {
        if (materials.some((m) => m.kind === 'link' && !isHttpUrl(m.url ?? ''))) throw new Error('Ссылка должна начинаться с http:// или https://');
        const row = data(await db().from('lessons').insert({ class_id: classId, title: required(title, 'Укажите тему урока'), body: body.trim(), materials }).select('*').single());
        return changed(toLesson(row as LessonRow));
      },
      async get(id) {
        if (!UUID.test(id)) return null;
        const { data: row, error } = await db().from('lessons').select('*').eq('id', id).maybeSingle();
        if (error) throw new Error(humanize(error));
        return row ? toLesson(row as LessonRow) : null;
      },
      async update(id, { title, body, materials }) {
        if (materials.some((m) => m.kind === 'link' && !isHttpUrl(m.url ?? ''))) throw new Error('Ссылка должна начинаться с http:// или https://');
        // RLS lessons_manage: чужой урок не обновится — maybeSingle вернёт null
        const { data: row, error } = await db().from('lessons').update({ title: required(title, 'Укажите тему урока'), body: body.trim(), materials }).eq('id', id).select('*').maybeSingle();
        if (error) throw new Error(humanize(error));
        if (!row) throw new Error(NOT_YOURS);
        return changed(toLesson(row as LessonRow));
      },
      async remove(id) {
        const removed = list(await db().from('lessons').delete().eq('id', id).select('id'));
        if (!removed.length) throw new Error(NOT_YOURS);
        changed(null);
      },
    },
    lessonRatings: {
      async listByLessons(lessonIds) {
        if (!lessonIds.length) return [];
        const result = await db().from('lesson_ratings').select('*').in('lesson_id', lessonIds);
        // ponytail: пока в базе не применена миграция 20260915000400, таблицы нет (PGRST205) —
        // класс открывается без оценок, а не падает целиком (CLASS-LOAD-FIX-001)
        if (result.error?.code === 'PGRST205') return [];
        return list(result).map((row) => toLessonRating(row as LessonRatingRow));
      },
      async rate({ lessonId, studentId, level }) {
        const row = data(
          await db()
            .from('lesson_ratings')
            .upsert({ lesson_id: lessonId, student_id: studentId, level, rated_at: nowIso() }, { onConflict: 'lesson_id,student_id' })
            .select('*')
            .single(),
        );
        return changed(toLessonRating(row as LessonRatingRow));
      },
    },
    assignments: {
      async listByClass(classId) {
        return list(await db().from('assignments').select('*').eq('class_id', classId).order('due_at')).map((row) => toAssignment(row as AssignmentRow));
      },
      async get(id) {
        const { data: row, error } = await db().from('assignments').select('*').eq('id', id).maybeSingle();
        if (error) throw new Error(humanize(error));
        return row ? toAssignment(row as AssignmentRow) : null;
      },
      async update(id, input) {
        const fields = assignmentFields(input);
        const graded = list(await db().from('submissions').select('grade').eq('assignment_id', id).not('grade', 'is', null)) as Array<{ grade: number }>;
        const top = Math.max(0, ...graded.map((s) => s.grade));
        if (fields.max_points < top) throw new Error(`Уже выставлена оценка ${top} — максимум баллов не может быть меньше`);
        // RLS assignments_manage: чужое задание не обновится — maybeSingle вернёт null
        const { data: row, error } = await db().from('assignments').update(fields).eq('id', id).select('*').maybeSingle();
        if (error) throw new Error(humanize(error));
        if (!row) throw new Error(NOT_YOURS);
        return changed(toAssignment(row as AssignmentRow));
      },
      async create({ classId, teacherId, ...input }) {
        const row = data(
          await db()
            .from('assignments')
            .insert({ class_id: classId, teacher_id: teacherId, ...assignmentFields(input) })
            .select('*')
            .single(),
        );
        return changed(toAssignment(row as AssignmentRow));
      },
    },
    comments: {
      async listBySubmission(submissionId) {
        return list(await db().from('submission_comments').select('*').eq('submission_id', submissionId).order('created_at')).map((row) => toComment(row as CommentRow));
      },
      async create({ submissionId, authorId, authorRole, body }) {
        const row = data(
          await db()
            .from('submission_comments')
            .insert({ submission_id: submissionId, author_id: authorId, author_role: authorRole, body: required(body, 'Напишите комментарий') })
            .select('*')
            .single(),
        );
        return changed(toComment(row as CommentRow));
      },
    },
  };
}

export const supabaseRepos: Repos = createSupabaseRepos(supabaseBrowser);

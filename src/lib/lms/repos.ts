import type { Assignment, BlogPost, ClassRoom, Comment, Lesson, LessonRating, LessonRatingLevel, MaterialRef, Role, Submission, User } from './types';
import { localDemoRepos } from './local-repos';

/**
 * Репозитории-интерфейсы учебного слоя. Все методы асинхронные, чтобы
 * Supabase-реализация встала на место LocalDemo без правок UI и хуков.
 * Мутации возвращают новые объекты и оповещают lmsBus.
 */

export interface ClassRepo {
  listForUser(user: User): Promise<ClassRoom[]>;
  get(id: string): Promise<ClassRoom | null>;
  create(input: { title: string; subject: string; teacherId: string }): Promise<ClassRoom>;
  join(inviteCode: string, studentId: string): Promise<ClassRoom>;
}

export interface LessonRepo {
  listByClass(classId: string): Promise<Lesson[]>;
  get(id: string): Promise<Lesson | null>;
  create(input: { classId: string; title: string; body: string; materials: MaterialRef[] }): Promise<Lesson>;
  /** Исправить опечатку: дата публикации не меняется (LESSON-EDIT-001). */
  update(id: string, input: { title: string; body: string; materials: MaterialRef[] }): Promise<Lesson>;
  remove(id: string): Promise<void>;
}

/** Одна оценка на пару урок × ученик; повторная заменяет прежнюю. В Supabase ученик читает свои, учитель — оценки своего класса. */
export interface LessonRatingRepo {
  listByLessons(lessonIds: string[]): Promise<LessonRating[]>;
  rate(input: { lessonId: string; studentId: string; level: LessonRatingLevel }): Promise<LessonRating>;
}

export interface AssignmentRepo {
  listByClass(classId: string): Promise<Assignment[]>;
  get(id: string): Promise<Assignment | null>;
  create(input: { classId: string; teacherId: string; title: string; brief: string; dueAt: string; maxPoints: number }): Promise<Assignment>;
  /** Максимум баллов нельзя опустить ниже уже выставленной оценки. */
  update(id: string, input: { title: string; brief: string; dueAt: string; maxPoints: number }): Promise<Assignment>;
}

export interface SubmissionRepo {
  listByAssignment(assignmentId: string): Promise<Submission[]>;
  listByStudent(studentId: string): Promise<Submission[]>;
  get(id: string): Promise<Submission | null>;
  getForStudent(assignmentId: string, studentId: string): Promise<Submission | null>;
  submit(input: { assignmentId: string; studentId: string; content: string; attachments: MaterialRef[] }): Promise<Submission>;
  grade(id: string, grade: number, maxPoints: number): Promise<Submission>;
}

export interface CommentRepo {
  listBySubmission(submissionId: string): Promise<Comment[]>;
  create(input: { submissionId: string; authorId: string; authorRole: Role; body: string }): Promise<Comment>;
}

export interface BlogRepo {
  listPublished(): Promise<BlogPost[]>;
  listByAuthor(authorId: string): Promise<BlogPost[]>;
  get(id: string): Promise<BlogPost | null>;
  getPublishedBySlug(slug: string): Promise<BlogPost | null>;
  createDraft(authorId: string): Promise<BlogPost>;
  save(post: BlogPost): Promise<BlogPost>;
  publish(id: string): Promise<BlogPost>;
  unpublish(id: string): Promise<BlogPost>;
}

/** Публичные профили: в Supabase это таблица profiles без email/пароля. */
export interface UserRepo {
  get(id: string): Promise<User | null>;
  listByIds(ids: string[]): Promise<User[]>;
}

export interface Repos {
  classes: ClassRepo;
  lessons: LessonRepo;
  lessonRatings: LessonRatingRepo;
  assignments: AssignmentRepo;
  submissions: SubmissionRepo;
  comments: CommentRepo;
  blog: BlogRepo;
  users: UserRepo;
}

export function lmsProvider(): 'demo' | 'supabase' {
  return process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase' ? 'supabase' : 'demo';
}

/**
 * Supabase-репозитории грузятся отдельным чанком (как вход): демо-страницы не
 * скачивают supabase-js. Каждый метод дожидается модуля и зовёт настоящий.
 */
function lazySupabaseRepos(): Repos {
  const load = () => import('./supabase-repos').then((m) => m.supabaseRepos);
  const section = <K extends keyof Repos>(key: K): Repos[K] =>
    new Proxy({} as Repos[K], {
      get: (_target, method: string | symbol) =>
        method === 'then' || typeof method === 'symbol'
          ? undefined // не притворяться thenable при await
          : async (...args: unknown[]) => {
              const repo = (await load())[key] as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
              return repo[method](...args);
            },
    });
  return {
    classes: section('classes'),
    lessons: section('lessons'),
    lessonRatings: section('lessonRatings'),
    assignments: section('assignments'),
    submissions: section('submissions'),
    comments: section('comments'),
    blog: section('blog'),
    users: section('users'),
  };
}

let supabaseInstance: Repos | null = null;

export function getRepos(): Repos {
  if (lmsProvider() === 'supabase') return (supabaseInstance ??= lazySupabaseRepos());
  return localDemoRepos;
}

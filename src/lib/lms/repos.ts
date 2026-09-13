import type { Assignment, BlogPost, ClassRoom, Comment, Lesson, MaterialRef, Role, Submission, User } from './types';
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
  create(input: { classId: string; title: string; body: string; materials: MaterialRef[] }): Promise<Lesson>;
}

export interface AssignmentRepo {
  listByClass(classId: string): Promise<Assignment[]>;
  get(id: string): Promise<Assignment | null>;
  create(input: { classId: string; teacherId: string; title: string; brief: string; dueAt: string; maxPoints: number }): Promise<Assignment>;
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
  assignments: AssignmentRepo;
  submissions: SubmissionRepo;
  comments: CommentRepo;
  blog: BlogRepo;
  users: UserRepo;
}

export function lmsProvider(): 'demo' | 'supabase' {
  return process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase' ? 'supabase' : 'demo';
}

export function getRepos(): Repos {
  if (lmsProvider() === 'supabase') {
    // TODO(supabase): SupabaseRepos с тем же интерфейсом — отдельный файл.
    throw new Error('Supabase-репозитории ещё не подключены: используйте NEXT_PUBLIC_AUTH_PROVIDER=demo');
  }
  return localDemoRepos;
}

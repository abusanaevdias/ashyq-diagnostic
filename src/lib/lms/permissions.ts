import type { SeasonParticipant, Team } from '@/lib/season/types';
import type { BlogPost, ClassRoom, Role, Submission, User } from './types';

/**
 * Единственный источник прав (ТЗ LMS-001 §1A). UI и гварды маршрутов читают
 * только этот файл — в компонентах своих проверок ролей нет.
 *
 * TODO(supabase): это клиентская проверка для демо. Сдачи, оценки и публикация
 * постов обязаны дублироваться серверными политиками (RLS) — см. TODO в
 * local-repos.ts.
 */

export type Action =
  /** Видеть свои классы, уроки, материалы. */
  | 'classes.view'
  /** Сдавать домашку. */
  | 'submission.create'
  /** Комментировать СВОЮ сдачу. */
  | 'submission.commentOwn'
  /** Создавать классы, уроки, материалы, задания. */
  | 'content.create'
  /** Комментировать любую сдачу в своих классах и ставить оценку. */
  | 'submission.review'
  /** Создавать, редактировать, публиковать посты блога. */
  | 'blog.write'
  /** Чемпионат: сезон, команды, баллы, проверка Match Day (организатор). */
  | 'season.manage'
  /** Чемпионат: Season HQ и ответ команды на Match Day. */
  | 'season.play';

export const ROLES: readonly Role[] = ['student', 'teacher', 'author'];

export const PERMISSIONS: Record<Action, readonly Role[]> = {
  'classes.view': ['student', 'teacher'],
  'submission.create': ['student'],
  'submission.commentOwn': ['student'],
  'content.create': ['teacher'],
  'submission.review': ['teacher'],
  'blog.write': ['author'],
  // решение пользователя 2026-09-14: команды собирает организатор или учитель
  'season.manage': ['teacher'],
  'season.play': ['student'],
};

export function can(role: Role | null | undefined, action: Action): boolean {
  return role != null && PERMISSIONS[action].includes(role);
}

/** Роли маршрутов выводятся из матрицы, а не задаются вручную. Блог читают все, без входа. */
export const ROUTE_ROLES = {
  me: ROLES,
  classes: PERMISSIONS['submission.create'],
  teacher: PERMISSIONS['content.create'],
  write: PERMISSIONS['blog.write'],
  seasonManage: PERMISSIONS['season.manage'],
  seasonPlay: PERMISSIONS['season.play'],
} as const;

export function roleAllowed(role: Role, roles: readonly Role[]): boolean {
  return roles.includes(role);
}

/** Ссылки кабинета по роли — для меню аватара и /me. Выводятся из матрицы. */
export function roleLinks(role: Role): Array<{ href: string; label: string; text: string }> {
  const links: Array<{ href: string; label: string; text: string }> = [];
  if (can(role, 'submission.create')) links.push({ href: '/classes', label: 'Мой класс', text: 'Уроки, материалы и задания ваших классов.' });
  if (can(role, 'content.create')) links.push({ href: '/teacher', label: 'Учителю', text: 'Классы, уроки, задания и проверка сдач.' });
  if (can(role, 'blog.write')) links.push({ href: '/write', label: 'Редактору', text: 'Черновики и публикации блога.' });
  if (can(role, 'season.play')) links.push({ href: '/season/current', label: 'Мой сезон', text: 'Команда, баллы недели и Match Day.' });
  if (can(role, 'season.manage')) links.push({ href: '/teacher/season', label: 'Чемпионат', text: 'Сезон, команды, баллы и проверка Match Day.' });
  return links;
}

export const ROLE_LABELS: Record<Role, string> = {
  student: 'ученик',
  teacher: 'учитель',
  author: 'автор',
};

/* ---------- проверки с контекстом (владение классом, сдачей, постом) ---------- */

export function canViewClass(user: User | null, cls: ClassRoom): boolean {
  if (!user || !can(user.role, 'classes.view')) return false;
  return user.role === 'teacher' ? cls.teacherId === user.id : cls.memberIds.includes(user.id);
}

export function canManageClass(user: User | null, cls: ClassRoom): boolean {
  return Boolean(user) && can(user!.role, 'content.create') && cls.teacherId === user!.id;
}

export function canSubmit(user: User | null, cls: ClassRoom): boolean {
  return Boolean(user) && can(user!.role, 'submission.create') && cls.memberIds.includes(user!.id);
}

export function canReviewSubmission(user: User | null, cls: ClassRoom): boolean {
  return Boolean(user) && can(user!.role, 'submission.review') && cls.teacherId === user!.id;
}

/** Тред сдачи видят и пишут только двое: автор сдачи и учитель класса. */
export function canUseThread(user: User | null, submission: Submission, cls: ClassRoom): boolean {
  if (!user) return false;
  if (can(user.role, 'submission.commentOwn') && submission.studentId === user.id) return true;
  return canReviewSubmission(user, cls);
}

export function canEditPost(user: User | null, post: BlogPost): boolean {
  return Boolean(user) && can(user!.role, 'blog.write') && post.authorId === user!.id;
}

/* ---------- чемпионат ---------- */

export function canManageSeason(user: User | null): boolean {
  return Boolean(user) && can(user!.role, 'season.manage');
}

/** Ответ на Match Day отправляет только капитан своей команды. */
export function canSubmitMatch(user: User | null, participant: SeasonParticipant | undefined, team: Team | undefined): boolean {
  return Boolean(user && participant && team) && can(user!.role, 'season.play') && team!.captainId === participant!.id;
}

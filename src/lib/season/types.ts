/**
 * Модель чемпионата ASHYQ (SEASON-DEMO-001). Решения пользователя 2026-09-14:
 * баллы — 5 категорий с недельным максимумом 100; команды ровно по 5, их
 * собирает организатор (роль teacher); даты сезона задаёт организатор; IELTS
 * и SAT — отдельные зачёты; публично — только псевдонимы.
 * Демо хранит всё в localStorage `ashyq:v2:season`; Supabase заменит репозиторий.
 */

export type Division = 'ielts' | 'sat';
export type Category = 'progress' | 'missions' | 'speaking' | 'attendance' | 'team';

export const DIVISIONS: readonly Division[] = ['ielts', 'sat'];
export const DIVISION_LABELS: Record<Division, string> = { ielts: 'IELTS', sat: 'SAT' };
export const CATEGORIES: readonly Category[] = ['progress', 'missions', 'speaking', 'attendance', 'team'];
export const CATEGORY_LABELS: Record<Category, string> = {
  progress: 'Прогресс',
  missions: 'Миссии',
  speaking: 'Speaking',
  attendance: 'Посещение',
  team: 'Команда',
};
/** Недельный максимум участника по категории; в сумме 100 («Команда» 30 — решение пользователя 2026-09-14). */
export const WEEKLY_CAPS: Record<Category, number> = { progress: 25, missions: 20, speaking: 15, attendance: 10, team: 30 };
export const TEAM_SIZE = 5;

export interface Season {
  id: string;
  name: string;
  divisions: Division[];
  startsAt: string;
  endsAt: string;
  createdBy: string;
  createdAt: string;
}

/** Участник сезона. Публично виден только alias; name — для организатора. */
export interface SeasonParticipant {
  id: string;
  seasonId: string;
  division: Division;
  alias: string;
  name: string;
  /** Связь с аккаунтом: userId (Supabase) или email (демо-аккаунты пересоздаются сидом LMS). */
  userId?: string;
  email?: string;
}

export interface Team {
  id: string;
  seasonId: string;
  division: Division;
  name: string;
  city: string;
  /** Ровно TEAM_SIZE id участников. */
  memberIds: string[];
  captainId: string;
}

export interface MatchDay {
  id: string;
  seasonId: string;
  title: string;
  startsAt: string;
  durationMin: number;
  venue: 'online' | 'offline';
  place: string;
  task: { title: string; brief: string };
}

export interface MatchSubmission {
  id: string;
  matchDayId: string;
  teamId: string;
  answer: string;
  /** id участника-капитана. */
  submittedBy: string;
  submittedAt: string;
  review?: { points: number; reviewedBy: string; reviewedAt: string };
}

export interface PointEntry {
  id: string;
  seasonId: string;
  participantId: string;
  category: Category;
  points: number;
  week: number;
  reason: string;
  awardedBy: string;
  createdAt: string;
}

export interface SeasonData {
  seasons: Season[];
  participants: SeasonParticipant[];
  teams: Team[];
  matchDays: MatchDay[];
  submissions: MatchSubmission[];
  points: PointEntry[];
}

export interface Standing {
  id: string;
  rank: number;
  name: string;
  meta: string;
  points: number;
  /** На сколько мест поднялся с прошлой недели (минус — опустился). */
  trend: number;
}

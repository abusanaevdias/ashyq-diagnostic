import {
  CATEGORIES,
  WEEKLY_CAPS,
  type Category,
  type Division,
  type MatchDay,
  type PointEntry,
  type Season,
  type SeasonParticipant,
  type Standing,
  type Team,
} from './types';

/** Чистые правила сезона: недели, лимиты, рейтинг. Без хранилища и UI. */

const WEEK = 7 * 24 * 3_600_000;

export function totalWeeks(season: Season): number {
  return Math.max(1, Math.ceil((Date.parse(season.endsAt) - Date.parse(season.startsAt)) / WEEK));
}

/** Неделя сезона для момента: 0 — ещё не начался, дальше 1…totalWeeks. */
export function weekOf(season: Season, at = Date.now()): number {
  const start = Date.parse(season.startsAt);
  if (at < start) return 0;
  return Math.min(totalWeeks(season), Math.floor((at - start) / WEEK) + 1);
}

export type SeasonPhase = 'upcoming' | 'active' | 'finished';

export function seasonPhase(season: Season, at = Date.now()): SeasonPhase {
  if (at < Date.parse(season.startsAt)) return 'upcoming';
  return at > Date.parse(season.endsAt) ? 'finished' : 'active';
}

/** Сезон для витрины: идущий, иначе ближайший будущий, иначе последний. */
export function currentSeason(seasons: Season[], at = Date.now()): Season | undefined {
  const sorted = [...seasons].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return sorted.find((s) => seasonPhase(s, at) === 'active') ?? sorted.find((s) => seasonPhase(s, at) === 'upcoming') ?? sorted[0];
}

export type MatchStatus = 'upcoming' | 'live' | 'done';

export function matchStatus(match: MatchDay, at = Date.now()): MatchStatus {
  const start = Date.parse(match.startsAt);
  if (at < start) return 'upcoming';
  return at <= start + match.durationMin * 60_000 ? 'live' : 'done';
}

const used = (entries: PointEntry[], participantId: string, category: Category, week: number) =>
  entries
    .filter((e) => e.participantId === participantId && e.category === category && e.week === week)
    .reduce((sum, e) => sum + e.points, 0);

/** Сколько ещё можно начислить участнику в категории на этой неделе. */
export function remainingCap(entries: PointEntry[], participantId: string, category: Category, week: number): number {
  return Math.max(0, WEEKLY_CAPS[category] - used(entries, participantId, category, week));
}

/** Баллы недели по категориям; потолок применяется и здесь — на случай ручной правки хранилища. */
export function weekBreakdown(entries: PointEntry[], participantId: string, week: number) {
  return CATEGORIES.map((category) => ({
    category,
    value: Math.min(used(entries, participantId, category, week), WEEKLY_CAPS[category]),
    max: WEEKLY_CAPS[category],
  }));
}

export function participantPoints(entries: PointEntry[], participantId: string, uptoWeek = Infinity): number {
  const weeks = new Set(entries.filter((e) => e.participantId === participantId && e.week <= uptoWeek).map((e) => e.week));
  let total = 0;
  for (const week of weeks) total += weekBreakdown(entries, participantId, week).reduce((sum, row) => sum + row.value, 0);
  return total;
}

/** Места по «спортивному» правилу: равные баллы — равное место. */
function ranked(rows: Array<Omit<Standing, 'rank' | 'trend'>>): Standing[] {
  const sorted = [...rows].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return sorted.map((row) => ({ ...row, rank: 1 + sorted.filter((other) => other.points > row.points).length, trend: 0 }));
}

function withTrend(current: Standing[], previous: Standing[]): Standing[] {
  return current.map((row) => {
    const before = previous.find((p) => p.id === row.id);
    return { ...row, trend: before ? before.rank - row.rank : 0 };
  });
}

export function individualStandings(participants: SeasonParticipant[], teams: Team[], entries: PointEntry[], division: Division, week: number): Standing[] {
  const rows = (upto: number) =>
    ranked(
      participants
        .filter((p) => p.division === division)
        .map((p) => ({
          id: p.id,
          name: p.alias,
          meta: teams.find((t) => t.memberIds.includes(p.id))?.name ?? 'без команды',
          points: participantPoints(entries, p.id, upto),
        })),
    );
  return withTrend(rows(week), rows(week - 1));
}

/** Команды ровно по 5 — сумма баллов участников сравнима без нормализации. */
export function teamStandings(teams: Team[], entries: PointEntry[], division: Division, week: number): Standing[] {
  const rows = (upto: number) =>
    ranked(
      teams
        .filter((t) => t.division === division)
        .map((t) => ({
          id: t.id,
          name: t.name,
          meta: t.city,
          points: t.memberIds.reduce((sum, id) => sum + participantPoints(entries, id, upto), 0),
        })),
    );
  return withTrend(rows(week), rows(week - 1));
}

/** Участник сезона для аккаунта: по userId, в демо — по email. */
export function participantFor(participants: SeasonParticipant[], seasonId: string, user: { id: string; email: string }): SeasonParticipant | undefined {
  return participants.find((p) => p.seasonId === seasonId && (p.userId === user.id || (p.email !== undefined && p.email === user.email)));
}

export function teamOf(teams: Team[], participantId: string): Team | undefined {
  return teams.find((t) => t.memberIds.includes(participantId));
}

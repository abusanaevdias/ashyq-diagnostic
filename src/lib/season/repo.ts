import { lmsProvider } from '@/lib/lms/repos';
import { lmsBus, newId, readJson, writeJson } from '@/lib/lms/store';
import { matchStatus, remainingCap, weekOf } from './scoring';
import { buildSeasonSeed } from './seed';
import {
  CATEGORY_LABELS,
  TEAM_SIZE,
  WEEKLY_CAPS,
  type Category,
  type Division,
  type MatchDay,
  type MatchSubmission,
  type PointEntry,
  type Season,
  type SeasonData,
  type SeasonParticipant,
  type Team,
} from './types';

/**
 * Репозиторий чемпионата. Все методы асинхронные — Supabase-реализация
 * встанет без правок UI. Права (кто организатор, кто капитан) проверяет UI
 * через src/lib/lms/permissions.ts.
 * TODO(supabase): SEASON-BACKEND-001 — те же методы поверх таблиц и RLS:
 * начислять баллы и проверять Match Day может только организатор сезона,
 * ответ команды — только её капитан.
 */
export interface SeasonRepo {
  load(): Promise<SeasonData>;
  createSeason(input: { name: string; divisions: Division[]; startsAt: string; endsAt: string; createdBy: string }): Promise<Season>;
  addParticipant(input: { seasonId: string; division: Division; alias: string; name: string; email?: string; userId?: string }): Promise<SeasonParticipant>;
  createTeam(input: { seasonId: string; division: Division; name: string; city: string; memberIds: string[]; captainId: string }): Promise<Team>;
  createMatchDay(input: Omit<MatchDay, 'id'>): Promise<MatchDay>;
  awardPoints(input: { seasonId: string; participantId: string; category: Category; points: number; reason: string; awardedBy: string; at?: number }): Promise<PointEntry>;
  submitMatch(input: { matchDayId: string; teamId: string; participantId: string; answer: string; at?: number }): Promise<MatchSubmission>;
  reviewMatch(input: { submissionId: string; points: number; reviewedBy: string; at?: number }): Promise<MatchSubmission>;
  resetDemo(): Promise<void>;
}

/** LocalDemo: всё одним документом в `ashyq:v2:season`; пока пусто — демо-сезон из сида. */
const KEY = 'season';
const read = (): SeasonData => readJson<SeasonData | null>(KEY, null) ?? buildSeasonSeed();
const save = (data: SeasonData) => {
  writeJson(KEY, data);
  lmsBus.emit();
};
const iso = (at = Date.now()) => new Date(at).toISOString();

function required(value: string, message: string): string {
  const clean = value.trim();
  if (!clean) throw new Error(message);
  return clean;
}

function must<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

export const localSeasonRepo: SeasonRepo = {
  async load() {
    return read();
  },

  async createSeason({ name, divisions, startsAt, endsAt, createdBy }) {
    const start = Date.parse(startsAt);
    const end = Date.parse(endsAt);
    if (Number.isNaN(start) || Number.isNaN(end)) throw new Error('Укажите даты начала и конца сезона');
    if (end <= start) throw new Error('Сезон должен заканчиваться позже, чем начинается');
    if (divisions.length === 0) throw new Error('Выберите хотя бы один дивизион');
    const data = read();
    const season: Season = {
      id: newId(),
      name: required(name, 'Укажите название сезона'),
      divisions: [...new Set(divisions)],
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(end).toISOString(),
      createdBy,
      createdAt: iso(),
    };
    save({ ...data, seasons: [...data.seasons, season] });
    return season;
  },

  async addParticipant({ seasonId, division, alias, name, email, userId }) {
    const data = read();
    const season = must(data.seasons.find((s) => s.id === seasonId), 'Сезон не найден');
    if (!season.divisions.includes(division)) throw new Error('В этом сезоне нет такого дивизиона');
    const cleanAlias = required(alias, 'Укажите псевдоним');
    const inSeason = data.participants.filter((p) => p.seasonId === seasonId);
    if (inSeason.some((p) => p.alias.toLowerCase() === cleanAlias.toLowerCase())) throw new Error('Такой псевдоним уже занят');
    if (email && inSeason.some((p) => p.email === email)) throw new Error('Этот ученик уже участвует в сезоне');
    const participant: SeasonParticipant = {
      id: newId(),
      seasonId,
      division,
      alias: cleanAlias,
      name: required(name, 'Укажите имя участника'),
      ...(email ? { email } : {}),
      ...(userId ? { userId } : {}),
    };
    save({ ...data, participants: [...data.participants, participant] });
    return participant;
  },

  async createTeam({ seasonId, division, name, city, memberIds, captainId }) {
    const data = read();
    const season = must(data.seasons.find((s) => s.id === seasonId), 'Сезон не найден');
    if (!season.divisions.includes(division)) throw new Error('В этом сезоне нет такого дивизиона');
    const members = [...new Set(memberIds)];
    if (members.length !== TEAM_SIZE) throw new Error(`В команде ровно ${TEAM_SIZE} участников`);
    for (const id of members) {
      const p = must(data.participants.find((x) => x.id === id && x.seasonId === seasonId), 'Участник не найден');
      if (p.division !== division) throw new Error(`${p.alias} заявлен в другом дивизионе`);
      if (data.teams.some((t) => t.seasonId === seasonId && t.memberIds.includes(id))) throw new Error(`${p.alias} уже в команде`);
    }
    if (!members.includes(captainId)) throw new Error('Капитан должен быть в составе команды');
    const cleanName = required(name, 'Укажите название команды');
    if (data.teams.some((t) => t.seasonId === seasonId && t.name.toLowerCase() === cleanName.toLowerCase())) throw new Error('Команда с таким названием уже есть');
    const team: Team = { id: newId(), seasonId, division, name: cleanName, city: city.trim(), memberIds: members, captainId };
    save({ ...data, teams: [...data.teams, team] });
    return team;
  },

  async createMatchDay({ seasonId, title, startsAt, durationMin, venue, place, task }) {
    const data = read();
    const season = must(data.seasons.find((s) => s.id === seasonId), 'Сезон не найден');
    const start = Date.parse(startsAt);
    if (Number.isNaN(start)) throw new Error('Укажите дату и время Match Day');
    if (start < Date.parse(season.startsAt) || start > Date.parse(season.endsAt)) throw new Error('Match Day должен быть в датах сезона');
    if (!Number.isInteger(durationMin) || durationMin < 10 || durationMin > 480) throw new Error('Длительность — от 10 до 480 минут');
    const match: MatchDay = {
      id: newId(),
      seasonId,
      title: required(title, 'Укажите название Match Day'),
      startsAt: new Date(start).toISOString(),
      durationMin,
      venue,
      place: required(place, 'Укажите место проведения'),
      task: { title: required(task.title, 'Укажите задание'), brief: task.brief.trim() },
    };
    save({ ...data, matchDays: [...data.matchDays, match] });
    return match;
  },

  async awardPoints({ seasonId, participantId, category, points, reason, awardedBy, at = Date.now() }) {
    const data = read();
    const season = must(data.seasons.find((s) => s.id === seasonId), 'Сезон не найден');
    must(data.participants.find((p) => p.id === participantId && p.seasonId === seasonId), 'Участник не найден');
    const week = weekOf(season, at);
    if (week === 0 || at > Date.parse(season.endsAt)) throw new Error('Баллы начисляются только во время сезона');
    if (!Number.isInteger(points) || points < 1) throw new Error('Баллы — целое число от 1');
    const left = remainingCap(data.points, participantId, category, week);
    if (points > left) throw new Error(`Лимит «${CATEGORY_LABELS[category]}» на неделе ${week}: осталось ${left} из ${WEEKLY_CAPS[category]}`);
    const entry: PointEntry = {
      id: newId(),
      seasonId,
      participantId,
      category,
      points,
      week,
      reason: required(reason, 'Укажите, за что начислены баллы'),
      awardedBy,
      createdAt: iso(at),
    };
    save({ ...data, points: [...data.points, entry] });
    return entry;
  },

  async submitMatch({ matchDayId, teamId, participantId, answer, at = Date.now() }) {
    const data = read();
    const match = must(data.matchDays.find((m) => m.id === matchDayId), 'Match Day не найден');
    const team = must(data.teams.find((t) => t.id === teamId), 'Команда не найдена');
    if (team.captainId !== participantId) throw new Error('Ответ команды отправляет капитан');
    const existing = data.submissions.find((s) => s.matchDayId === matchDayId && s.teamId === teamId);
    if (existing?.review) throw new Error('Ответ уже проверен — изменить его нельзя');
    if (matchStatus(match, at) !== 'live') throw new Error('Ответы принимаются только во время Match Day');
    const submission: MatchSubmission = {
      id: existing?.id ?? newId(),
      matchDayId,
      teamId,
      answer: required(answer, 'Напишите ответ команды'),
      submittedBy: participantId,
      submittedAt: iso(at),
    };
    save({ ...data, submissions: [...data.submissions.filter((s) => s.id !== submission.id), submission] });
    return submission;
  },

  async reviewMatch({ submissionId, points, reviewedBy, at = Date.now() }) {
    const data = read();
    const submission = must(data.submissions.find((s) => s.id === submissionId), 'Ответ не найден');
    if (submission.review) throw new Error('Ответ уже проверен');
    if (!Number.isInteger(points) || points < 0 || points > WEEKLY_CAPS.team) throw new Error(`Баллы команде — целое число от 0 до ${WEEKLY_CAPS.team}`);
    const team = must(data.teams.find((t) => t.id === submission.teamId), 'Команда не найдена');
    const season = must(data.seasons.find((s) => s.id === team.seasonId), 'Сезон не найден');
    const match = must(data.matchDays.find((m) => m.id === submission.matchDayId), 'Match Day не найден');
    const week = Math.max(1, weekOf(season, Date.parse(match.startsAt)));
    // каждому из пятерых — «Команда» за неделю матча, в пределах недельного лимита
    const entries: PointEntry[] = [];
    for (const memberId of team.memberIds) {
      const value = Math.min(points, remainingCap([...data.points, ...entries], memberId, 'team', week));
      if (value > 0) {
        entries.push({ id: newId(), seasonId: season.id, participantId: memberId, category: 'team', points: value, week, reason: `Match Day: ${match.title}`, awardedBy: reviewedBy, createdAt: iso(at) });
      }
    }
    const reviewed: MatchSubmission = { ...submission, review: { points, reviewedBy, reviewedAt: iso(at) } };
    save({ ...data, points: [...data.points, ...entries], submissions: data.submissions.map((s) => (s.id === submissionId ? reviewed : s)) });
    return reviewed;
  },

  async resetDemo() {
    save(buildSeasonSeed());
  },
};

/** Supabase-репозиторий сезона (SUPABASE-SEASON-001) грузится отдельным чанком: демо не тянет supabase-js. */
const supabaseSeason = () => import('./supabase-repo').then((m) => m.supabaseSeasonRepo);

const lazySupabaseSeasonRepo: SeasonRepo = {
  load: async () => (await supabaseSeason()).load(),
  createSeason: async (input) => (await supabaseSeason()).createSeason(input),
  addParticipant: async (input) => (await supabaseSeason()).addParticipant(input),
  createTeam: async (input) => (await supabaseSeason()).createTeam(input),
  createMatchDay: async (input) => (await supabaseSeason()).createMatchDay(input),
  awardPoints: async (input) => (await supabaseSeason()).awardPoints(input),
  submitMatch: async (input) => (await supabaseSeason()).submitMatch(input),
  reviewMatch: async (input) => (await supabaseSeason()).reviewMatch(input),
  resetDemo: async () => (await supabaseSeason()).resetDemo(),
};

export function getSeasonRepo(): SeasonRepo {
  return lmsProvider() === 'supabase' ? lazySupabaseSeasonRepo : localSeasonRepo;
}

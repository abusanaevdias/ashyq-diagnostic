import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { lmsBus } from '@/lib/lms/store';
import { supabaseBrowser } from '@/lib/lms/supabase-auth';
import type { SeasonRepo } from './repo';
import { matchStatus, weekOf } from './scoring';
import { CATEGORY_LABELS, TEAM_SIZE, WEEKLY_CAPS, type MatchDay, type MatchSubmission, type PointEntry, type Season, type SeasonData } from './types';

/**
 * Чемпионат на Supabase (SUPABASE-SEASON-001). Читается одним снимком
 * `season_snapshot()` — БД сама урезает его по роли; составные действия идут
 * через атомарные RPC миграции `20260914000600_season_backend.sql`. Проверки
 * ниже — только понятные сообщения до запроса: правила держит БД.
 */

type SeasonRow = { id: string; name: string; divisions: Season['divisions']; starts_at: string; ends_at: string; created_by: string; created_at: string };
type MatchRow = { id: string; season_id: string; title: string; starts_at: string; duration_min: number; venue: MatchDay['venue']; place: string; task_title: string; task_brief: string };
type SubmissionRow = { id: string; match_day_id: string; team_id: string; answer: string; submitted_by: string; submitted_at: string; review_points: number | null; reviewed_by: string | null; reviewed_at: string | null };

const toSeason = (r: SeasonRow): Season => ({ id: r.id, name: r.name, divisions: r.divisions, startsAt: r.starts_at, endsAt: r.ends_at, createdBy: r.created_by, createdAt: r.created_at });
const toMatch = (r: MatchRow): MatchDay => ({ id: r.id, seasonId: r.season_id, title: r.title, startsAt: r.starts_at, durationMin: r.duration_min, venue: r.venue, place: r.place, task: { title: r.task_title, brief: r.task_brief } });
const toSubmission = (r: SubmissionRow): MatchSubmission => ({
  id: r.id,
  matchDayId: r.match_day_id,
  teamId: r.team_id,
  answer: r.answer,
  submittedBy: r.submitted_by,
  submittedAt: r.submitted_at,
  ...(r.review_points === null ? {} : { review: { points: r.review_points, reviewedBy: r.reviewed_by ?? '', reviewedAt: r.reviewed_at ?? '' } }),
});

/** Ошибки БД → сообщения интерфейса (тексты — из миграций). */
function humanize(error: PostgrestError): string {
  // postgrest-js кладёт в error тело ответа как есть: у ответа шлюза/Auth поля message может не быть (ERROR-SHAPE-FIX-001)
  const text = typeof error.message === 'string' && error.message ? error.message : `Ошибка сервера${error.code ? ` (код ${error.code})` : ''}. Обновите страницу или попробуйте позже.`;
  const known: Array<[string, string]> = [
    ['exactly five participants', `В команде ровно ${TEAM_SIZE} участников`],
    ['Captain must be a team member', 'Капитан должен быть в составе команды'],
    ['same season and division', 'Участник заявлен в другом дивизионе'],
    ['No account with this email', 'Аккаунта с таким email нет — ученик сначала регистрируется на сайте'],
    ['Season division not found', 'В этом сезоне нет такого дивизиона'],
    ['Weekly category cap exceeded', 'Недельный лимит категории исчерпан'],
    ['only during Match Day', 'Ответы принимаются только во время Match Day'],
    ['Only the team captain', 'Ответ команды отправляет капитан'],
    ['already reviewed', 'Ответ уже проверен'],
    ['Only season organizers', 'Это может только организатор сезона'],
    ['must be between 0 and 30', `Баллы команде — целое число от 0 до ${WEEKLY_CAPS.team}`],
  ];
  const hit = known.find(([needle]) => text.includes(needle));
  if (hit) return hit[1];
  if (error.code === '23505') {
    if (/alias/.test(text)) return 'Такой псевдоним уже занят';
    if (/user_id/.test(text)) return 'Этот ученик уже участвует в сезоне';
    if (/participant_id/.test(text)) return 'Участник уже в команде';
    if (/name/.test(text)) return 'Команда с таким названием уже есть';
  }
  if (error.code === '42501' || /row-level security/i.test(text)) return 'Недостаточно прав для этого действия';
  return text;
}

function data(result: { data: unknown; error: PostgrestError | null }, missing = 'Запись не найдена'): unknown {
  if (result.error) throw new Error(humanize(result.error));
  if (result.data === null || result.data === undefined) throw new Error(missing);
  return result.data;
}

function required(value: string, message: string): string {
  const clean = value.trim();
  if (!clean) throw new Error(message);
  return clean;
}

function changed<T>(value: T): T {
  lmsBus.emit();
  return value;
}

export function createSupabaseSeasonRepo(client: () => SupabaseClient): SeasonRepo {
  const db = () => client();
  const season = async (id: string): Promise<Season> => toSeason(data(await db().from('seasons').select('*').eq('id', id).maybeSingle(), 'Сезон не найден') as SeasonRow);

  const repo: SeasonRepo = {
    async load() {
      return data(await db().rpc('season_snapshot')) as SeasonData;
    },

    async createSeason({ name, divisions, startsAt, endsAt, createdBy }) {
      const start = Date.parse(startsAt);
      const end = Date.parse(endsAt);
      if (Number.isNaN(start) || Number.isNaN(end)) throw new Error('Укажите даты начала и конца сезона');
      if (end <= start) throw new Error('Сезон должен заканчиваться позже, чем начинается');
      if (divisions.length === 0) throw new Error('Выберите хотя бы один дивизион');
      const row = data(
        await db()
          .from('seasons')
          .insert({ name: required(name, 'Укажите название сезона'), divisions: [...new Set(divisions)], starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString(), created_by: createdBy })
          .select('*')
          .single(),
      );
      return changed(toSeason(row as SeasonRow));
    },

    async addParticipant({ seasonId, division, alias, name, email }) {
      const cleanAlias = required(alias, 'Укажите псевдоним');
      const cleanName = required(name, 'Укажите имя участника');
      const id = data(await db().rpc('add_season_participant', { p_season_id: seasonId, p_division: division, p_alias: cleanAlias, p_name: cleanName, p_email: email?.trim() || null })) as string;
      return changed({ id, seasonId, division, alias: cleanAlias, name: cleanName, ...(email ? { email } : {}) });
    },

    async createTeam({ seasonId, division, name, city, memberIds, captainId }) {
      const members = [...new Set(memberIds)];
      if (members.length !== TEAM_SIZE) throw new Error(`В команде ровно ${TEAM_SIZE} участников`);
      if (!members.includes(captainId)) throw new Error('Капитан должен быть в составе команды');
      const cleanName = required(name, 'Укажите название команды');
      const id = data(
        await db().rpc('create_season_team', { p_season_id: seasonId, p_division: division, p_name: cleanName, p_city: city.trim(), p_member_ids: members, p_captain_id: captainId }),
      ) as string;
      return changed({ id, seasonId, division, name: cleanName, city: city.trim(), memberIds: members, captainId });
    },

    async createMatchDay({ seasonId, title, startsAt, durationMin, venue, place, task }) {
      const target = await season(seasonId);
      const start = Date.parse(startsAt);
      if (Number.isNaN(start)) throw new Error('Укажите дату и время Match Day');
      if (start < Date.parse(target.startsAt) || start > Date.parse(target.endsAt)) throw new Error('Match Day должен быть в датах сезона');
      if (!Number.isInteger(durationMin) || durationMin < 10 || durationMin > 480) throw new Error('Длительность — от 10 до 480 минут');
      const row = data(
        await db()
          .from('match_days')
          .insert({
            season_id: seasonId,
            title: required(title, 'Укажите название Match Day'),
            starts_at: new Date(start).toISOString(),
            duration_min: durationMin,
            venue,
            place: required(place, 'Укажите место проведения'),
            task_title: required(task.title, 'Укажите задание'),
            task_brief: task.brief.trim(),
          })
          .select('*')
          .single(),
      );
      return changed(toMatch(row as MatchRow));
    },

    async awardPoints({ seasonId, participantId, category, points, reason, awardedBy, at = Date.now() }) {
      const target = await season(seasonId);
      const week = weekOf(target, at);
      if (week === 0 || at > Date.parse(target.endsAt)) throw new Error('Баллы начисляются только во время сезона');
      if (!Number.isInteger(points) || points < 1) throw new Error('Баллы — целое число от 1');
      const { data: rows, error } = await db().from('season_point_entries').select('points').eq('participant_id', participantId).eq('week', week).eq('category', category);
      if (error) throw new Error(humanize(error));
      const left = Math.max(0, WEEKLY_CAPS[category] - (rows ?? []).reduce((sum, r) => sum + (r as { points: number }).points, 0));
      if (points > left) throw new Error(`Лимит «${CATEGORY_LABELS[category]}» на неделе ${week}: осталось ${left} из ${WEEKLY_CAPS[category]}`);
      const row = data(
        await db()
          .from('season_point_entries')
          .insert({ season_id: seasonId, participant_id: participantId, category, points, week, reason: required(reason, 'Укажите, за что начислены баллы'), awarded_by: awardedBy })
          .select('*')
          .single(),
      ) as { id: string; created_at: string; reason: string };
      const entry: PointEntry = { id: row.id, seasonId, participantId, category, points, week, reason: row.reason, awardedBy, createdAt: row.created_at };
      return changed(entry);
    },

    async submitMatch({ matchDayId, teamId, participantId, answer, at = Date.now() }) {
      const match = toMatch(data(await db().from('match_days').select('*').eq('id', matchDayId).maybeSingle(), 'Match Day не найден') as MatchRow);
      const { data: existingRow, error } = await db().from('match_submissions').select('*').eq('match_day_id', matchDayId).eq('team_id', teamId).maybeSingle();
      if (error) throw new Error(humanize(error));
      const existing = existingRow ? toSubmission(existingRow as SubmissionRow) : null;
      if (existing?.review) throw new Error('Ответ уже проверен — изменить его нельзя');
      if (matchStatus(match, at) !== 'live') throw new Error('Ответы принимаются только во время Match Day');
      const edit = { answer: required(answer, 'Напишите ответ команды'), submitted_at: new Date(at).toISOString() };
      // UPDATE разрешён только по answer/submitted_at (права на столбцы): автор ответа не меняется
      const row = existing
        ? data(await db().from('match_submissions').update(edit).eq('id', existing.id).select('*').single())
        : data(await db().from('match_submissions').insert({ ...edit, submitted_by: participantId, match_day_id: matchDayId, team_id: teamId }).select('*').single());
      return changed(toSubmission(row as SubmissionRow));
    },

    async reviewMatch({ submissionId, points }) {
      if (!Number.isInteger(points) || points < 0 || points > WEEKLY_CAPS.team) throw new Error(`Баллы команде — целое число от 0 до ${WEEKLY_CAPS.team}`);
      data(await db().rpc('review_match_and_award', { p_submission_id: submissionId, p_points: points }));
      const row = data(await db().from('match_submissions').select('*').eq('id', submissionId).maybeSingle(), 'Ответ не найден');
      return changed(toSubmission(row as SubmissionRow));
    },

    async resetDemo() {
      throw new Error('Сброс демо-сезона есть только в демо-режиме: здесь данные настоящие');
    },
  };
  return repo;
}

export const supabaseSeasonRepo: SeasonRepo = createSupabaseSeasonRepo(supabaseBrowser);

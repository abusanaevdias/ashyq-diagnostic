-- Чемпионат на Supabase (SUPABASE-SEASON-001). Интерфейс считает рейтинги из
-- цельного документа SeasonData, поэтому данные отдаёт одна RPC-снимок с
-- урезанием по роли: организатор видит всё, ученик — публичное + своё,
-- аноним — только публичное (псевдонимы, команды, матчи, баллы без поводов).
-- Составные действия (команда целиком, проверка + баллы) — атомарные RPC.

-- 1. Ответ Match Day правит только капитан и только во время матча
--    (раньше вставку проверяла политика, а правку мог сделать любой член команды).
create or replace function private.enforce_match_answer()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare target_match public.match_days%rowtype; target_team public.season_teams%rowtype;
begin
  if (select auth.uid()) is null then return new; end if; -- SQL-админ и service role
  select * into target_match from public.match_days where id = new.match_day_id;
  select * into target_team from public.season_teams where id = new.team_id;
  if not exists (
    select 1 from public.season_participants
    where id = target_team.captain_id and user_id = (select auth.uid())
  ) then
    raise exception 'Only the team captain can submit the answer';
  end if;
  if now() < target_match.starts_at
    or now() > target_match.starts_at + make_interval(mins => target_match.duration_min) then
    raise exception 'Answers are accepted only during Match Day';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_match_answer on public.match_submissions;
create trigger enforce_match_answer before insert or update of answer, submitted_by, submitted_at on public.match_submissions
for each row execute function private.enforce_match_answer();

-- 2. Команда создаётся целиком: ровно пять участников, капитан из состава
create or replace function public.create_season_team(
  p_season_id uuid, p_division text, p_name text, p_city text, p_member_ids uuid[], p_captain_id uuid
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_team uuid; members uuid[];
begin
  if not (select private.is_teacher()) then raise exception 'Only season organizers can create teams'; end if;
  select array_agg(distinct m) into members from unnest(p_member_ids) as m;
  if coalesce(cardinality(members), 0) <> 5 then raise exception 'A season team must have exactly five participants'; end if;
  if not (p_captain_id = any(members)) then raise exception 'Captain must be a team member'; end if;
  insert into public.season_teams (season_id, division, name, city, captain_id)
  values (p_season_id, p_division, trim(p_name), coalesce(trim(p_city), ''), p_captain_id)
  returning id into new_team;
  insert into public.season_team_members (team_id, participant_id)
  select new_team, m from unnest(members) as m;
  return new_team;
end;
$$;

-- 3. Участник сезона; с email — связан с аккаунтом ученика (иначе его Season HQ пуст)
create or replace function public.add_season_participant(
  p_season_id uuid, p_division text, p_alias text, p_name text, p_email text default null
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare account uuid; new_participant uuid;
begin
  if not (select private.is_teacher()) then raise exception 'Only season organizers can add participants'; end if;
  if not exists (select 1 from public.seasons where id = p_season_id and p_division = any(divisions)) then
    raise exception 'Season division not found';
  end if;
  if nullif(trim(coalesce(p_email, '')), '') is not null then
    select id into account from auth.users where lower(email) = lower(trim(p_email));
    if account is null then raise exception 'No account with this email'; end if;
  end if;
  insert into public.season_participants (season_id, division, alias, private_name, user_id)
  values (p_season_id, p_division, trim(p_alias), trim(p_name), account)
  returning id into new_participant;
  return new_participant;
end;
$$;

-- 4. Проверка ответа Match Day и баллы «Команда» каждому из пятерых — одной транзакцией.
--    Неделя — неделя матча (как weekOf в src/lib/season/scoring.ts), в пределах недельного лимита 30.
create or replace function public.review_match_and_award(p_submission_id uuid, p_points integer)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  target public.match_submissions%rowtype;
  the_match public.match_days%rowtype;
  the_season public.seasons%rowtype;
  match_week integer;
  member uuid;
  left_points integer;
begin
  if not (select private.is_teacher()) then raise exception 'Only season organizers can review Match Day'; end if;
  if p_points < 0 or p_points > 30 then raise exception 'Match Day points must be between 0 and 30'; end if;
  update public.match_submissions
  set review_points = p_points, reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = p_submission_id and review_points is null
  returning * into target;
  if target.id is null then raise exception 'Submission not found or already reviewed'; end if;

  select * into the_match from public.match_days where id = target.match_day_id;
  select * into the_season from public.seasons where id = the_match.season_id;
  match_week := greatest(1, least(
    greatest(1, ceil(extract(epoch from (the_season.ends_at - the_season.starts_at)) / 604800)::integer),
    floor(extract(epoch from (the_match.starts_at - the_season.starts_at)) / 604800)::integer + 1
  ));

  if p_points > 0 then
    for member in select participant_id from public.season_team_members where team_id = target.team_id loop
      select 30 - coalesce(sum(points), 0) into left_points
      from public.season_point_entries
      where participant_id = member and week = match_week and category = 'team';
      if least(p_points, left_points) > 0 then
        insert into public.season_point_entries (season_id, participant_id, category, points, week, reason, awarded_by)
        values (the_season.id, member, 'team', least(p_points, left_points), match_week,
          'Match Day: ' || the_match.title, (select auth.uid()));
      end if;
    end loop;
  end if;
  return target.id;
end;
$$;

-- 5. Снимок сезона в форме SeasonData (camelCase, как src/lib/season/types.ts)
create or replace function public.season_snapshot()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  organizer boolean := coalesce((select private.is_teacher()), false);
begin
  return jsonb_build_object(
    'seasons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'divisions', to_jsonb(s.divisions),
        'startsAt', s.starts_at, 'endsAt', s.ends_at,
        'createdBy', case when organizer then s.created_by::text else '' end,
        'createdAt', s.created_at
      ) order by s.starts_at)
      from public.seasons s
    ), '[]'::jsonb),
    'participants', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', p.id, 'seasonId', p.season_id, 'division', p.division, 'alias', p.alias,
        'name', case when organizer then p.private_name else p.alias end,
        'userId', case when organizer or p.user_id = me then p.user_id end
      )) order by p.alias)
      from public.season_participants p
    ), '[]'::jsonb),
    'teams', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'seasonId', t.season_id, 'division', t.division, 'name', t.name, 'city', t.city,
        'memberIds', coalesce((select jsonb_agg(m.participant_id order by m.joined_at) from public.season_team_members m where m.team_id = t.id), '[]'::jsonb),
        'captainId', t.captain_id
      ) order by t.name)
      from public.season_teams t
    ), '[]'::jsonb),
    'matchDays', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'seasonId', d.season_id, 'title', d.title, 'startsAt', d.starts_at,
        'durationMin', d.duration_min, 'venue', d.venue, 'place', d.place,
        'task', jsonb_build_object(
          'title', d.task_title,
          'brief', case when organizer or (select private.is_season_member(d.season_id)) then d.task_brief else '' end
        )
      ) order by d.starts_at)
      from public.match_days d
    ), '[]'::jsonb),
    'submissions', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', ms.id, 'matchDayId', ms.match_day_id, 'teamId', ms.team_id, 'answer', ms.answer,
        'submittedBy', ms.submitted_by, 'submittedAt', ms.submitted_at,
        'review', case when ms.review_points is not null then jsonb_build_object(
          'points', ms.review_points,
          'reviewedBy', case when organizer then ms.reviewed_by::text else '' end,
          'reviewedAt', ms.reviewed_at
        ) end
      )) order by ms.submitted_at)
      from public.match_submissions ms
      where me is not null and (organizer or (select private.is_team_member(ms.team_id)))
    ), '[]'::jsonb),
    'points', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'seasonId', e.season_id, 'participantId', e.participant_id, 'category', e.category,
        'points', e.points, 'week', e.week,
        'reason', case when organizer or own.user_id = me then e.reason else '' end,
        'awardedBy', case when organizer then e.awarded_by::text else '' end,
        'createdAt', e.created_at
      ) order by e.created_at)
      from public.season_point_entries e
      join public.season_participants own on own.id = e.participant_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.create_season_team(uuid, text, text, text, uuid[], uuid) from public, anon, authenticated;
revoke all on function public.add_season_participant(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.review_match_and_award(uuid, integer) from public, anon, authenticated;
revoke all on function public.season_snapshot() from public, anon, authenticated;
revoke all on function private.enforce_match_answer() from public, anon, authenticated;
grant execute on function public.create_season_team(uuid, text, text, text, uuid[], uuid) to authenticated;
grant execute on function public.add_season_participant(uuid, text, text, text, text) to authenticated;
grant execute on function public.review_match_and_award(uuid, integer) to authenticated;
grant execute on function public.season_snapshot() to anon, authenticated;

-- Серверные операции админа (выгрузка, удаление по запросу) — через service role
grant select, insert, update, delete on public.seasons, public.season_participants, public.season_teams,
  public.season_team_members, public.match_days, public.match_submissions, public.season_point_entries
  to service_role;

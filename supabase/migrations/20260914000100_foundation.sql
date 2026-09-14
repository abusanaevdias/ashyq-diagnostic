-- ASHYQ Supabase foundation. Safe to replay: objects are created conditionally,
-- functions are replaced, and named policies/triggers are recreated explicitly.

create schema if not exists private;
revoke all on schema private from public, anon;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  role text not null default 'student' check (role in ('student', 'teacher', 'author', 'admin')),
  avatar_color text not null default 'red' check (avatar_color in ('red', 'red-deep', 'ink', 'dark-warm')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  subject text not null check (length(trim(subject)) between 1 and 80),
  teacher_id uuid not null references public.profiles(id),
  invite_code text not null unique check (length(invite_code) between 6 and 32),
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  body text not null default '',
  materials jsonb not null default '[]'::jsonb check (jsonb_typeof(materials) = 'array'),
  published_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id),
  title text not null check (length(trim(title)) between 1 and 200),
  brief text not null default '',
  due_at timestamptz not null,
  max_points integer not null check (max_points between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id),
  content text not null default '',
  attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array'),
  submitted_at timestamptz not null default now(),
  status text not null default 'submitted' check (status in ('submitted', 'graded')),
  grade integer check (grade is null or grade >= 0),
  unique (assignment_id, student_id),
  check ((status = 'submitted' and grade is null) or status = 'graded')
);

create table if not exists public.submission_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  author_role text not null check (author_role in ('student', 'teacher', 'author')),
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 1 and 200),
  category text not null check (length(trim(category)) between 1 and 80),
  excerpt text not null default '',
  body text not null default '',
  cover_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid not null references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'draft' or published_at is not null)
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  divisions text[] not null check (
    cardinality(divisions) > 0
    and divisions <@ array['ielts', 'sat']::text[]
  ),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.season_participants (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  division text not null check (division in ('ielts', 'sat')),
  alias text not null check (length(trim(alias)) between 1 and 60),
  private_name text not null check (length(trim(private_name)) between 1 and 120),
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (season_id, alias),
  unique (season_id, user_id)
);

create table if not exists public.season_teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  division text not null check (division in ('ielts', 'sat')),
  name text not null check (length(trim(name)) between 1 and 100),
  city text not null default '',
  captain_id uuid not null references public.season_participants(id),
  created_at timestamptz not null default now(),
  unique (season_id, name)
);

create table if not exists public.season_team_members (
  team_id uuid not null references public.season_teams(id) on delete cascade,
  participant_id uuid not null references public.season_participants(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, participant_id),
  unique (participant_id)
);

create table if not exists public.match_days (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  starts_at timestamptz not null,
  duration_min integer not null check (duration_min between 10 and 480),
  venue text not null check (venue in ('online', 'offline')),
  place text not null check (length(trim(place)) between 1 and 200),
  task_title text not null check (length(trim(task_title)) between 1 and 200),
  task_brief text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.match_submissions (
  id uuid primary key default gen_random_uuid(),
  match_day_id uuid not null references public.match_days(id) on delete cascade,
  team_id uuid not null references public.season_teams(id) on delete cascade,
  answer text not null check (length(trim(answer)) > 0),
  submitted_by uuid not null references public.season_participants(id),
  submitted_at timestamptz not null default now(),
  review_points integer check (review_points between 0 and 30),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  unique (match_day_id, team_id),
  check ((review_points is null and reviewed_by is null and reviewed_at is null)
    or (review_points is not null and reviewed_by is not null and reviewed_at is not null))
);

create table if not exists public.season_point_entries (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  participant_id uuid not null references public.season_participants(id) on delete cascade,
  category text not null check (category in ('progress', 'missions', 'speaking', 'attendance', 'team')),
  points integer not null check (points > 0),
  week integer not null check (week > 0),
  reason text not null check (length(trim(reason)) between 1 and 500),
  awarded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists classes_teacher_idx on public.classes(teacher_id);
create index if not exists class_members_student_idx on public.class_members(student_id);
create index if not exists lessons_class_idx on public.lessons(class_id);
create index if not exists assignments_class_idx on public.assignments(class_id);
create index if not exists submissions_student_idx on public.submissions(student_id);
create index if not exists comments_submission_idx on public.submission_comments(submission_id);
create index if not exists blog_posts_public_idx on public.blog_posts(status, published_at desc);
create index if not exists participants_user_idx on public.season_participants(user_id);
create unique index if not exists participants_alias_ci_idx on public.season_participants(season_id, lower(alias));
create index if not exists teams_season_idx on public.season_teams(season_id, division);
create unique index if not exists teams_name_ci_idx on public.season_teams(season_id, lower(name));
create index if not exists team_members_participant_idx on public.season_team_members(participant_id);
create index if not exists match_days_season_idx on public.match_days(season_id, starts_at);
create index if not exists match_submissions_team_idx on public.match_submissions(team_id);
create index if not exists point_entries_week_idx on public.season_point_entries(participant_id, week, category);

create or replace function private.current_role()
returns text language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = (select auth.uid()) $$;

create or replace function private.is_teacher()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((select private.current_role()) in ('teacher', 'admin'), false) $$;

create or replace function private.can_manage_class(target_class uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.classes
  where id = target_class and teacher_id = (select auth.uid())
) $$;

create or replace function private.can_view_class(target_class uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select (select private.can_manage_class(target_class)) or exists (
  select 1 from public.class_members
  where class_id = target_class and student_id = (select auth.uid())
) $$;

create or replace function private.can_view_submission(target_submission uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.submissions s
  join public.assignments a on a.id = s.assignment_id
  where s.id = target_submission
    and (s.student_id = (select auth.uid()) or (select private.can_manage_class(a.class_id)))
) $$;

create or replace function private.is_season_member(target_season uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.season_participants
  where season_id = target_season and user_id = (select auth.uid())
) $$;

create or replace function private.is_team_member(target_team uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1
  from public.season_team_members stm
  join public.season_participants sp on sp.id = stm.participant_id
  where stm.team_id = target_team and sp.user_id = (select auth.uid())
) $$;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end $$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  requested_avatar text;
begin
  requested_avatar := new.raw_user_meta_data ->> 'avatar_color';
  insert into public.profiles (id, display_name, avatar_color)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Ученик'
    ),
    case when requested_avatar in ('red', 'red-deep', 'ink', 'dark-warm')
      then requested_avatar else 'red' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.enforce_team_member()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  target_team public.season_teams%rowtype;
  target_participant public.season_participants%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.team_id::text, 0));
  select * into target_team from public.season_teams where id = new.team_id;
  select * into target_participant from public.season_participants where id = new.participant_id;
  if target_team.season_id <> target_participant.season_id or target_team.division <> target_participant.division then
    raise exception 'Team member must belong to the same season and division';
  end if;
  if (select count(*) from public.season_team_members where team_id = new.team_id) >= 5 then
    raise exception 'A season team can contain at most five participants';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_team_record()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare captain public.season_participants%rowtype;
begin
  select * into captain from public.season_participants where id = new.captain_id;
  if captain.id is null or captain.season_id <> new.season_id or captain.division <> new.division then
    raise exception 'Captain must belong to the same season and division';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_match_submission()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare target_match public.match_days%rowtype; target_team public.season_teams%rowtype;
begin
  select * into target_match from public.match_days where id = new.match_day_id;
  select * into target_team from public.season_teams where id = new.team_id;
  if target_match.id is null or target_team.id is null or target_match.season_id <> target_team.season_id then
    raise exception 'Match Day and team must belong to the same season';
  end if;
  if new.submitted_by <> target_team.captain_id then
    raise exception 'Only the team captain can be recorded as submitter';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_weekly_cap()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  category_cap integer;
  already_awarded integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    new.participant_id::text || ':' || new.week::text || ':' || new.category,
    0
  ));
  if not exists (
    select 1 from public.season_participants
    where id = new.participant_id and season_id = new.season_id
  ) then
    raise exception 'Point recipient must belong to the season';
  end if;
  category_cap := case new.category
    when 'progress' then 25 when 'missions' then 20 when 'speaking' then 15
    when 'attendance' then 10 when 'team' then 30 end;
  select coalesce(sum(points), 0) into already_awarded
  from public.season_point_entries
  where participant_id = new.participant_id and week = new.week and category = new.category;
  if already_awarded + new.points > category_cap then
    raise exception 'Weekly category cap exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at before update on public.blog_posts
for each row execute function private.set_updated_at();
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();
drop trigger if exists enforce_team_member on public.season_team_members;
create trigger enforce_team_member before insert on public.season_team_members
for each row execute function private.enforce_team_member();
drop trigger if exists enforce_team_record on public.season_teams;
create trigger enforce_team_record before insert or update on public.season_teams
for each row execute function private.enforce_team_record();
drop trigger if exists enforce_match_submission on public.match_submissions;
create trigger enforce_match_submission before insert or update of match_day_id, team_id, submitted_by on public.match_submissions
for each row execute function private.enforce_match_submission();
drop trigger if exists enforce_weekly_cap on public.season_point_entries;
create trigger enforce_weekly_cap before insert on public.season_point_entries
for each row execute function private.enforce_weekly_cap();

create or replace function public.join_class(p_invite_code text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare target_class uuid;
begin
  if (select private.current_role()) <> 'student' then raise exception 'Only students can join classes'; end if;
  select id into target_class from public.classes where invite_code = trim(p_invite_code);
  if target_class is null then raise exception 'Class not found'; end if;
  insert into public.class_members(class_id, student_id) values (target_class, (select auth.uid()))
  on conflict do nothing;
  return target_class;
end;
$$;

create or replace function public.grade_submission(p_submission_id uuid, p_grade integer)
returns public.submissions language plpgsql security definer set search_path = ''
as $$
declare target public.submissions%rowtype; maximum integer;
begin
  select s.* into target
  from public.submissions s join public.assignments a on a.id = s.assignment_id
  where s.id = p_submission_id and (select private.can_manage_class(a.class_id));
  if target.id is null then raise exception 'Submission not found'; end if;
  select max_points into maximum from public.assignments where id = target.assignment_id;
  if p_grade < 0 or p_grade > maximum then raise exception 'Grade is outside assignment range'; end if;
  update public.submissions set grade = p_grade, status = 'graded' where id = p_submission_id returning * into target;
  return target;
end;
$$;

create or replace function public.review_match_submission(p_submission_id uuid, p_points integer)
returns public.match_submissions language plpgsql security definer set search_path = ''
as $$
declare target public.match_submissions%rowtype;
begin
  if not (select private.is_teacher()) then raise exception 'Only season organizers can review Match Day'; end if;
  if p_points < 0 or p_points > 30 then raise exception 'Match Day points must be between 0 and 30'; end if;
  update public.match_submissions
  set review_points = p_points, reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = p_submission_id and review_points is null
  returning * into target;
  if target.id is null then raise exception 'Submission not found or already reviewed'; end if;
  return target;
end;
$$;

create or replace function public.season_leaderboard(p_season_id uuid, p_division text)
returns table(participant_id uuid, alias text, points integer)
language sql stable security definer set search_path = ''
as $$
  select sp.id, sp.alias, coalesce(sum(spe.points), 0)::integer
  from public.season_participants sp
  left join public.season_point_entries spe on spe.participant_id = sp.id
  where sp.season_id = p_season_id and sp.division = p_division
    and p_division in ('ielts', 'sat')
  group by sp.id, sp.alias
  order by coalesce(sum(spe.points), 0) desc, sp.alias asc
$$;

revoke all on function public.join_class(text) from public, anon, authenticated;
revoke all on function public.grade_submission(uuid, integer) from public, anon, authenticated;
revoke all on function public.review_match_submission(uuid, integer) from public, anon, authenticated;
revoke all on function public.season_leaderboard(uuid, text) from public, anon, authenticated;
grant execute on function public.join_class(text) to authenticated;
grant execute on function public.grade_submission(uuid, integer) to authenticated;
grant execute on function public.review_match_submission(uuid, integer) to authenticated;
grant execute on function public.season_leaderboard(uuid, text) to anon, authenticated;
grant usage on schema private to authenticated;
revoke all on function private.current_role(), private.is_teacher(),
  private.can_manage_class(uuid), private.can_view_class(uuid),
  private.can_view_submission(uuid), private.is_season_member(uuid),
  private.is_team_member(uuid), private.set_updated_at(), private.handle_new_user(),
  private.enforce_team_member(), private.enforce_team_record(),
  private.enforce_match_submission(), private.enforce_weekly_cap()
  from public, anon, authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.is_teacher() to authenticated;
grant execute on function private.can_manage_class(uuid) to authenticated;
grant execute on function private.can_view_class(uuid) to authenticated;
grant execute on function private.can_view_submission(uuid) to authenticated;
grant execute on function private.is_season_member(uuid) to authenticated;
grant execute on function private.is_team_member(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.lessons enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_comments enable row level security;
alter table public.blog_posts enable row level security;
alter table public.seasons enable row level security;
alter table public.season_participants enable row level security;
alter table public.season_teams enable row level security;
alter table public.season_team_members enable row level security;
alter table public.match_days enable row level security;
alter table public.match_submissions enable row level security;
alter table public.season_point_entries enable row level security;

revoke all on public.profiles, public.classes, public.class_members, public.lessons,
  public.assignments, public.submissions, public.submission_comments, public.blog_posts,
  public.seasons, public.season_participants, public.season_teams,
  public.season_team_members, public.match_days, public.match_submissions,
  public.season_point_entries from anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant select on public.profiles, public.classes, public.class_members, public.lessons,
  public.assignments, public.submissions, public.submission_comments, public.seasons,
  public.season_participants, public.season_teams, public.season_team_members,
  public.match_days, public.match_submissions, public.season_point_entries to authenticated;
grant update (display_name, avatar_color, updated_at) on public.profiles to authenticated;
grant insert, update, delete on public.classes, public.class_members, public.lessons,
  public.assignments, public.submission_comments, public.blog_posts, public.seasons,
  public.season_participants, public.season_teams, public.season_team_members,
  public.match_days, public.season_point_entries to authenticated;
grant insert (assignment_id, student_id, content, attachments, submitted_at) on public.submissions to authenticated;
grant update (content, attachments, submitted_at) on public.submissions to authenticated;
grant insert (match_day_id, team_id, answer, submitted_by, submitted_at) on public.match_submissions to authenticated;
grant update (answer, submitted_at) on public.match_submissions to authenticated;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists classes_read on public.classes;
create policy classes_read on public.classes for select to authenticated using ((select private.can_view_class(id)));
drop policy if exists classes_create on public.classes;
create policy classes_create on public.classes for insert to authenticated
with check (teacher_id = (select auth.uid()) and (select private.is_teacher()));
drop policy if exists classes_manage on public.classes;
create policy classes_manage on public.classes for update to authenticated
using ((select private.can_manage_class(id))) with check (teacher_id = (select auth.uid()));
drop policy if exists classes_delete on public.classes;
create policy classes_delete on public.classes for delete to authenticated using ((select private.can_manage_class(id)));

drop policy if exists class_members_read on public.class_members;
create policy class_members_read on public.class_members for select to authenticated using ((select private.can_view_class(class_id)));
drop policy if exists class_members_manage on public.class_members;
create policy class_members_manage on public.class_members for all to authenticated
using ((select private.can_manage_class(class_id))) with check ((select private.can_manage_class(class_id)));

drop policy if exists lessons_read on public.lessons;
create policy lessons_read on public.lessons for select to authenticated using ((select private.can_view_class(class_id)));
drop policy if exists lessons_manage on public.lessons;
create policy lessons_manage on public.lessons for all to authenticated
using ((select private.can_manage_class(class_id))) with check ((select private.can_manage_class(class_id)));

drop policy if exists assignments_read on public.assignments;
create policy assignments_read on public.assignments for select to authenticated using ((select private.can_view_class(class_id)));
drop policy if exists assignments_manage on public.assignments;
create policy assignments_manage on public.assignments for all to authenticated
using ((select private.can_manage_class(class_id)))
with check (teacher_id = (select auth.uid()) and (select private.can_manage_class(class_id)));

drop policy if exists submissions_read on public.submissions;
create policy submissions_read on public.submissions for select to authenticated using (
  student_id = (select auth.uid()) or (select private.can_view_submission(id))
);
drop policy if exists submissions_create on public.submissions;
create policy submissions_create on public.submissions for insert to authenticated with check (
  (select private.current_role()) = 'student'
  and student_id = (select auth.uid()) and exists (
    select 1 from public.assignments a where a.id = assignment_id and (select private.can_view_class(a.class_id))
  )
);
drop policy if exists submissions_edit_own on public.submissions;
create policy submissions_edit_own on public.submissions for update to authenticated
using (student_id = (select auth.uid()) and status = 'submitted')
with check (student_id = (select auth.uid()) and status = 'submitted' and grade is null);

drop policy if exists comments_read on public.submission_comments;
create policy comments_read on public.submission_comments for select to authenticated
using ((select private.can_view_submission(submission_id)));
drop policy if exists comments_create on public.submission_comments;
create policy comments_create on public.submission_comments for insert to authenticated with check (
  author_id = (select auth.uid())
  and author_role = (select private.current_role())
  and (select private.can_view_submission(submission_id))
);
drop policy if exists comments_delete_own on public.submission_comments;
create policy comments_delete_own on public.submission_comments for delete to authenticated
using (author_id = (select auth.uid()));

drop policy if exists blog_public_read on public.blog_posts;
create policy blog_public_read on public.blog_posts for select to anon, authenticated
using (status = 'published' or author_id = (select auth.uid()));
drop policy if exists blog_author_manage on public.blog_posts;
create policy blog_author_manage on public.blog_posts for all to authenticated
using (author_id = (select auth.uid()) and (select private.current_role()) in ('author', 'admin'))
with check (author_id = (select auth.uid()) and (select private.current_role()) in ('author', 'admin'));

drop policy if exists seasons_read on public.seasons;
create policy seasons_read on public.seasons for select to authenticated
using ((select private.is_teacher()) or (select private.is_season_member(id)));
drop policy if exists seasons_manage on public.seasons;
create policy seasons_manage on public.seasons for all to authenticated
using ((select private.is_teacher())) with check (created_by = (select auth.uid()) and (select private.is_teacher()));

drop policy if exists participants_read on public.season_participants;
create policy participants_read on public.season_participants for select to authenticated
using ((select private.is_teacher()) or user_id = (select auth.uid()));
drop policy if exists participants_manage on public.season_participants;
create policy participants_manage on public.season_participants for all to authenticated
using ((select private.is_teacher())) with check ((select private.is_teacher()));

drop policy if exists teams_read on public.season_teams;
create policy teams_read on public.season_teams for select to authenticated
using ((select private.is_teacher()) or (select private.is_team_member(id)));
drop policy if exists teams_manage on public.season_teams;
create policy teams_manage on public.season_teams for all to authenticated
using ((select private.is_teacher())) with check ((select private.is_teacher()));

drop policy if exists team_members_read on public.season_team_members;
create policy team_members_read on public.season_team_members for select to authenticated
using ((select private.is_teacher()) or (select private.is_team_member(team_id)));
drop policy if exists team_members_manage on public.season_team_members;
create policy team_members_manage on public.season_team_members for all to authenticated
using ((select private.is_teacher())) with check ((select private.is_teacher()));

drop policy if exists match_days_read on public.match_days;
create policy match_days_read on public.match_days for select to authenticated
using ((select private.is_teacher()) or (select private.is_season_member(season_id)));
drop policy if exists match_days_manage on public.match_days;
create policy match_days_manage on public.match_days for all to authenticated
using ((select private.is_teacher())) with check ((select private.is_teacher()));

drop policy if exists match_submissions_read on public.match_submissions;
create policy match_submissions_read on public.match_submissions for select to authenticated
using ((select private.is_teacher()) or (select private.is_team_member(team_id)));
drop policy if exists match_submissions_create on public.match_submissions;
create policy match_submissions_create on public.match_submissions for insert to authenticated with check (
  exists (
    select 1 from public.season_teams st
    join public.season_participants sp on sp.id = st.captain_id
    where st.id = team_id and sp.id = submitted_by and sp.user_id = (select auth.uid())
  )
);
drop policy if exists match_submissions_update on public.match_submissions;
create policy match_submissions_update on public.match_submissions for update to authenticated
using ((select private.is_team_member(team_id)) and review_points is null)
with check (review_points is null and reviewed_by is null and reviewed_at is null);

drop policy if exists point_entries_read on public.season_point_entries;
create policy point_entries_read on public.season_point_entries for select to authenticated
using ((select private.is_teacher()) or exists (
  select 1 from public.season_participants sp
  where sp.id = participant_id and sp.user_id = (select auth.uid())
));
drop policy if exists point_entries_manage on public.season_point_entries;
create policy point_entries_manage on public.season_point_entries for all to authenticated
using ((select private.is_teacher())) with check ((select private.is_teacher()) and awarded_by = (select auth.uid()));

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(32);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'classes', 'classes exists');
select has_table('public', 'class_members', 'class_members exists');
select has_table('public', 'lessons', 'lessons exists');
select has_table('public', 'assignments', 'assignments exists');
select has_table('public', 'submissions', 'submissions exists');
select has_table('public', 'submission_comments', 'submission_comments exists');
select has_table('public', 'blog_posts', 'blog_posts exists');
select has_table('public', 'seasons', 'seasons exists');
select has_table('public', 'season_participants', 'season_participants exists');
select has_table('public', 'season_teams', 'season_teams exists');
select has_table('public', 'season_team_members', 'season_team_members exists');
select has_table('public', 'match_days', 'match_days exists');
select has_table('public', 'match_submissions', 'match_submissions exists');
select has_table('public', 'season_point_entries', 'season_point_entries exists');

select ok(relrowsecurity, relname || ' has RLS enabled')
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'profiles', 'classes', 'class_members', 'lessons', 'assignments',
    'submissions', 'submission_comments', 'blog_posts', 'seasons',
    'season_participants', 'season_teams', 'season_team_members', 'match_days',
    'match_submissions', 'season_point_entries'
  )
order by relname;

select ok(
  has_function_privilege('anon', 'public.season_leaderboard(uuid,text)', 'EXECUTE'),
  'anonymous users can read alias-only leaderboard'
);
select ok(
  not has_function_privilege('anon', 'public.grade_submission(uuid,integer)', 'EXECUTE'),
  'anonymous users cannot grade submissions'
);

select * from finish();
rollback;

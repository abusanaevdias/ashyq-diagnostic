begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(14);

insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'teacher@example.test', '{"name":"Teacher","role":"admin"}', now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'student@example.test', '{"name":"Student"}', now(), now()),
  ('33333333-3333-4333-8333-333333333333', 'other@example.test', '{"name":"Other"}', now(), now());

select is(
  (select role from profiles where id = '11111111-1111-4111-8111-111111111111'),
  'student',
  'signup metadata cannot grant an application role'
);
select is(
  (select display_name from profiles where id = '22222222-2222-4222-8222-222222222222'),
  'Student',
  'signup trigger copies the display name'
);

update profiles set role = 'teacher' where id = '11111111-1111-4111-8111-111111111111';
insert into classes (id, title, subject, teacher_id, invite_code)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'IELTS A', 'IELTS',
  '11111111-1111-4111-8111-111111111111', 'JOIN-IELTS'
);

set local role anon;
select is((select count(*) from blog_posts), 0::bigint, 'anon sees no unpublished blog rows');
reset role;

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
set local role authenticated;
select is(
  join_class('JOIN-IELTS'),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'student joins a class through the guarded RPC'
);
select is((select count(*) from class_members), 1::bigint, 'student sees own class membership');
select throws_ok(
  $$insert into classes (title, subject, teacher_id, invite_code)
    values ('Forbidden', 'IELTS', '22222222-2222-4222-8222-222222222222', 'NO-STUDENT')$$,
  '42501',
  'new row violates row-level security policy for table "classes"',
  'student cannot create a class'
);
reset role;

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select is((select count(*) from classes), 1::bigint, 'teacher sees the class they own');
reset role;

insert into seasons (id, name, divisions, starts_at, ends_at, created_by)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Test season', array['ielts'],
  now() - interval '1 day', now() + interval '30 days',
  '11111111-1111-4111-8111-111111111111'
);
insert into season_participants (id, season_id, division, alias, private_name, user_id)
values
  ('c0000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ielts', 'Alpha', 'Private A', '22222222-2222-4222-8222-222222222222'),
  ('c0000000-0000-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ielts', 'Bravo', 'Private B', null),
  ('c0000000-0000-4000-8000-000000000003', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ielts', 'Charlie', 'Private C', null),
  ('c0000000-0000-4000-8000-000000000004', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ielts', 'Delta', 'Private D', null),
  ('c0000000-0000-4000-8000-000000000005', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ielts', 'Echo', 'Private E', null),
  ('c0000000-0000-4000-8000-000000000006', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ielts', 'Foxtrot', 'Private F', null);

select lives_ok(
  $$insert into season_point_entries (season_id, participant_id, category, points, week, reason, awarded_by)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'c0000000-0000-4000-8000-000000000001',
      'progress', 25, 1, 'Test cap', '11111111-1111-4111-8111-111111111111')$$,
  'weekly cap accepts its exact limit'
);
select throws_ok(
  $$insert into season_point_entries (season_id, participant_id, category, points, week, reason, awarded_by)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'c0000000-0000-4000-8000-000000000001',
      'progress', 1, 1, 'Over cap', '11111111-1111-4111-8111-111111111111')$$,
  'P0001', 'Weekly category cap exceeded', 'weekly cap rejects an extra point'
);

insert into season_teams (id, season_id, division, name, city, captain_id)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'ielts', 'Qadam', 'Astana', 'c0000000-0000-4000-8000-000000000001'
);
insert into season_team_members (team_id, participant_id)
select 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', id
from season_participants
where id in (
  'c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004',
  'c0000000-0000-4000-8000-000000000005'
);
select is(
  (select count(*) from season_team_members where team_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  5::bigint,
  'team accepts five participants'
);
select throws_ok(
  $$insert into season_team_members (team_id, participant_id)
    values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'c0000000-0000-4000-8000-000000000006')$$,
  'P0001', 'A season team can contain at most five participants', 'team rejects a sixth participant'
);

select is(
  (select proargnames[3:5]::text from pg_proc where oid = 'season_leaderboard(uuid,text)'::regprocedure),
  '{participant_id,alias,points}',
  'public leaderboard exposes only safe output columns'
);
select ok(
  not has_table_privilege('anon', 'public.season_participants', 'select'),
  'anon cannot read private participant rows'
);

set local role anon;
select is(
  (select count(*) from season_leaderboard('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ielts')),
  6::bigint,
  'anon can read the alias-only leaderboard RPC'
);
reset role;

select * from finish();
rollback;

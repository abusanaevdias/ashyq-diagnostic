begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(17);

-- Организатор, два ученика (капитан и участник), посторонний
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at) values
  ('a1111111-1111-4111-8111-111111111111', 'org@example.test', '{"name":"Org"}', now(), now()),
  ('a2222222-2222-4222-8222-222222222222', 'captain@example.test', '{"name":"Captain"}', now(), now()),
  ('a3333333-3333-4333-8333-333333333333', 'member@example.test', '{"name":"Member"}', now(), now()),
  ('a4444444-4444-4444-8444-444444444444', 'outsider@example.test', '{"name":"Outsider"}', now(), now());
update profiles set role = 'teacher' where id = 'a1111111-1111-4111-8111-111111111111';

insert into seasons (id, name, divisions, starts_at, ends_at, created_by)
values ('b1111111-1111-4111-8111-111111111111', 'Season Test', array['ielts'], now() - interval '8 days', now() + interval '20 days',
  'a1111111-1111-4111-8111-111111111111');

-- Организатор добавляет участников; двое связаны с аккаунтами по email
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select lives_ok($$ select add_season_participant('b1111111-1111-4111-8111-111111111111', 'ielts', 'Qadam-1', 'Captain Private', 'CAPTAIN@example.test') $$, 'organizer adds participant by account email');
select lives_ok($$ select add_season_participant('b1111111-1111-4111-8111-111111111111', 'ielts', 'Qadam-2', 'Member Private', 'member@example.test') $$, 'second linked participant');
select lives_ok($$ select add_season_participant('b1111111-1111-4111-8111-111111111111', 'ielts', 'Qadam-3', 'Third Private') $$, 'participant without account');
select lives_ok($$ select add_season_participant('b1111111-1111-4111-8111-111111111111', 'ielts', 'Qadam-4', 'Fourth Private') $$, 'fourth participant');
select lives_ok($$ select add_season_participant('b1111111-1111-4111-8111-111111111111', 'ielts', 'Qadam-5', 'Fifth Private') $$, 'fifth participant');
select throws_ok($$ select add_season_participant('b1111111-1111-4111-8111-111111111111', 'ielts', 'Ghost', 'Ghost', 'nobody@example.test') $$,
  'P0001', 'No account with this email', 'unknown email is rejected');
select throws_ok($$ select create_season_team('b1111111-1111-4111-8111-111111111111', 'ielts', 'Short', '',
  (select array_agg(id) from (select id from season_participants order by alias limit 4) x), (select id from season_participants where alias = 'Qadam-1')) $$,
  'P0001', 'A season team must have exactly five participants', 'team of four is rejected');
select lives_ok($$ select create_season_team('b1111111-1111-4111-8111-111111111111', 'ielts', 'Qadam', 'Astana',
  (select array_agg(id) from season_participants), (select id from season_participants where alias = 'Qadam-1')) $$, 'team of five is created atomically');
insert into match_days (id, season_id, title, starts_at, duration_min, venue, place, task_title, task_brief)
values ('c1111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111111', 'Qualifier', now() - interval '10 minutes', 120, 'online', 'Online', 'Speaking Battle', 'Secret brief');
reset role;

-- Не капитан не может ни отправить, ни править ответ; капитан — может, пока матч идёт
select set_config('request.jwt.claim.sub', 'a3333333-3333-4333-8333-333333333333', true);
set local role authenticated;
select throws_ok($$ insert into match_submissions (match_day_id, team_id, answer, submitted_by)
  values ('c1111111-1111-4111-8111-111111111111', (select id from season_teams where name = 'Qadam'), 'Not captain', (select id from season_participants where alias = 'Qadam-1')) $$,
  'P0001', 'Only the team captain can submit the answer', 'team member who is not captain cannot submit');
reset role;
select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
set local role authenticated;
select lives_ok($$ insert into match_submissions (match_day_id, team_id, answer, submitted_by)
  values ('c1111111-1111-4111-8111-111111111111', (select id from season_teams where name = 'Qadam'), 'Captain answer', (select id from season_participants where alias = 'Qadam-1')) $$,
  'captain submits during the match');
reset role;
select set_config('request.jwt.claim.sub', 'a3333333-3333-4333-8333-333333333333', true);
set local role authenticated;
select throws_ok($$ update match_submissions set answer = 'Hijacked' where match_day_id = 'c1111111-1111-4111-8111-111111111111' $$,
  'P0001', 'Only the team captain can submit the answer', 'team member cannot edit the captain answer');
reset role;

-- Проверка организатором: баллы «Команда» всем пятерым одной транзакцией
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select lives_ok($$ select review_match_and_award((select id from match_submissions limit 1), 12) $$, 'organizer reviews and awards');
reset role;
select is((select count(*) from season_point_entries where category = 'team' and points = 12), 5::bigint, 'each of five members gets team points');

-- Снимок: аноним не видит приватных имён, поводов, ответов и брифа задания
select set_config('request.jwt.claim.sub', '', true); -- у анонима нет sub
set local role anon;
select is((select count(*) from jsonb_array_elements(season_snapshot() -> 'participants') p where p ->> 'name' like '%Private%'), 0::bigint, 'anon snapshot hides private names');
select is((select count(*) from jsonb_array_elements(season_snapshot() -> 'submissions')), 0::bigint, 'anon snapshot has no team answers');
reset role;
-- Ученик-участник видит ответ своей команды и свой userId; посторонний — нет
select set_config('request.jwt.claim.sub', 'a3333333-3333-4333-8333-333333333333', true);
set local role authenticated;
select is((select count(*) from jsonb_array_elements(season_snapshot() -> 'submissions')), 1::bigint, 'member sees own team answer');
reset role;
select set_config('request.jwt.claim.sub', 'a4444444-4444-4444-8444-444444444444', true);
set local role authenticated;
select is(
  (select season_snapshot() -> 'matchDays' -> 0 -> 'task' ->> 'brief'),
  '',
  'outsider does not see the Match Day brief'
);
reset role;

select * from finish();
rollback;

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(7);

-- Учитель, ученик класса, ученик вне класса (LESSON-RATING-001)
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at) values
  ('e1111111-1111-4111-8111-111111111111', 'teacher@example.test', '{"name":"Teacher"}', now(), now()),
  ('e2222222-2222-4222-8222-222222222222', 'member@example.test', '{"name":"Member"}', now(), now()),
  ('e3333333-3333-4333-8333-333333333333', 'outsider@example.test', '{"name":"Outsider"}', now(), now());
update profiles set role = 'teacher' where id = 'e1111111-1111-4111-8111-111111111111';
insert into classes (id, title, subject, teacher_id, invite_code)
  values ('e4444444-4444-4444-8444-444444444444', 'SAT Math', 'SAT', 'e1111111-1111-4111-8111-111111111111', 'RATE0001');
insert into class_members (class_id, student_id) values ('e4444444-4444-4444-8444-444444444444', 'e2222222-2222-4222-8222-222222222222');
insert into lessons (id, class_id, title) values ('e5555555-5555-4555-8555-555555555555', 'e4444444-4444-4444-8444-444444444444', 'Linear equations');

-- Ученик класса оценивает урок, повторная оценка заменяет прежнюю
select set_config('request.jwt.claim.sub', 'e2222222-2222-4222-8222-222222222222', true);
set local role authenticated;
select lives_ok($$ insert into lesson_ratings (lesson_id, student_id, level) values ('e5555555-5555-4555-8555-555555555555', 'e2222222-2222-4222-8222-222222222222', 3) $$, 'member rates lesson');
select lives_ok($$ insert into lesson_ratings (lesson_id, student_id, level) values ('e5555555-5555-4555-8555-555555555555', 'e2222222-2222-4222-8222-222222222222', 1)
  on conflict (lesson_id, student_id) do update set level = excluded.level $$, 'member re-rates lesson');
select is((select level from lesson_ratings), 1::smallint, 'one rating with the latest level');
select throws_ok($$ update lesson_ratings set level = 5 $$, '23514', null, 'level stays within 1..4');
reset role;

-- Чужой ученик не оценивает и не видит оценки; учитель класса видит
select set_config('request.jwt.claim.sub', 'e3333333-3333-4333-8333-333333333333', true);
set local role authenticated;
select throws_ok($$ insert into lesson_ratings (lesson_id, student_id, level) values ('e5555555-5555-4555-8555-555555555555', 'e3333333-3333-4333-8333-333333333333', 2) $$,
  '42501', null, 'outsider cannot rate');
select is((select count(*) from lesson_ratings), 0::bigint, 'outsider sees no ratings');
reset role;

select set_config('request.jwt.claim.sub', 'e1111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select is((select count(*) from lesson_ratings), 1::bigint, 'teacher sees class ratings');
reset role;

select * from finish();
rollback;

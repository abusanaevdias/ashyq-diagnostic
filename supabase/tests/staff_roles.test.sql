begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(9);

-- Админ, менеджер, ученик (STAFF-ROLES-001)
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at) values
  ('d1111111-1111-4111-8111-111111111111', 'admin@example.test', '{"name":"Admin"}', now(), now()),
  ('d2222222-2222-4222-8222-222222222222', 'manager@example.test', '{"name":"Manager"}', now(), now()),
  ('d3333333-3333-4333-8333-333333333333', 'student@example.test', '{"name":"Student"}', now(), now());
update profiles set role = 'admin' where id = 'd1111111-1111-4111-8111-111111111111';
update profiles set role = 'manager' where id = 'd2222222-2222-4222-8222-222222222222';

-- Ученик не видит список и не повышает сам себя
select set_config('request.jwt.claim.sub', 'd3333333-3333-4333-8333-333333333333', true);
set local role authenticated;
select throws_ok($$ select * from staff_list_users() $$, 'P0001', 'Only admins and managers can manage roles', 'student cannot list users');
select throws_ok($$ select staff_set_role('d3333333-3333-4333-8333-333333333333', 'teacher') $$,
  'P0001', 'Only admins and managers can manage roles', 'student cannot promote self');
reset role;

-- Менеджер видит пользователей и делает ученика учителем, но не выдаёт admin и не трогает админа
select set_config('request.jwt.claim.sub', 'd2222222-2222-4222-8222-222222222222', true);
set local role authenticated;
select ok((select count(*) from staff_list_users() where email = 'student@example.test') = 1, 'manager sees users with email');
select lives_ok($$ select staff_set_role('d3333333-3333-4333-8333-333333333333', 'teacher') $$, 'manager makes student a teacher');
select throws_ok($$ select staff_set_role('d3333333-3333-4333-8333-333333333333', 'admin') $$,
  'P0001', 'Only student, teacher or author can be set on the site', 'manager cannot grant admin');
select throws_ok($$ select staff_set_role('d1111111-1111-4111-8111-111111111111', 'student') $$,
  'P0001', 'Staff roles are changed only in SQL Editor', 'manager cannot demote admin');
reset role;
select is((select role from profiles where id = 'd3333333-3333-4333-8333-333333333333'), 'teacher', 'new role is saved');

-- Аноним не вызывает функции вовсе
set local role anon;
select throws_ok($$ select * from staff_list_users() $$, '42501', 'permission denied for function staff_list_users', 'anon has no execute');
reset role;

-- Админ возвращает роль ученика
select set_config('request.jwt.claim.sub', 'd1111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select lives_ok($$ select staff_set_role('d3333333-3333-4333-8333-333333333333', 'student') $$, 'admin returns student role');
reset role;

select * from finish();
rollback;

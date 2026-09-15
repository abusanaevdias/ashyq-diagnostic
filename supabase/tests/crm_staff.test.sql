begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(5);

insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
  ('66666666-6666-4666-8666-666666666666', 'manager@example.test', '{"name":"Manager"}', now(), now()),
  ('77777777-7777-4777-8777-777777777777', 'student@example.test', '{"name":"Student","role":"manager"}', now(), now());

select is(
  (select role from profiles where id = '77777777-7777-4777-8777-777777777777'),
  'student',
  'signup metadata cannot grant manager'
);

set local role service_role;
select lives_ok(
  $$ update profiles set role = 'manager' where id = '66666666-6666-4666-8666-666666666666' $$,
  'service role grants manager'
);
reset role;

select throws_ok(
  $$ update profiles set role = 'owner' where id = '66666666-6666-4666-8666-666666666666' $$,
  '23514',
  null,
  'unknown roles are still rejected'
);

select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
set local role authenticated;
select throws_ok(
  $$ update profiles set role = 'manager' where id = '77777777-7777-4777-8777-777777777777' $$,
  '42501',
  null,
  'student cannot make self a manager'
);
reset role;

select is(
  (select role from profiles where id = '77777777-7777-4777-8777-777777777777'),
  'student',
  'student role unchanged'
);

select * from finish();
rollback;

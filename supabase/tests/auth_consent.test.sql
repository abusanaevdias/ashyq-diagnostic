begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

select throws_ok(
  $$ insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
     values ('33333333-3333-4333-8333-333333333333', 'minor@example.test', '{"name":"Minor","is_minor":true}', now(), now()) $$,
  '23514',
  'guardian consent is required for minors',
  'minor without guardian consent cannot sign up'
);

select lives_ok(
  $$ insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
     values ('44444444-4444-4444-8444-444444444444', 'minor2@example.test', '{"name":"Minor","is_minor":true,"guardian_consent":true}', now(), now()) $$,
  'minor with guardian consent signs up'
);

select isnt(
  (select guardian_consent_at from private.signup_consents where user_id = '44444444-4444-4444-8444-444444444444'),
  null,
  'guardian consent timestamp is stored privately'
);

insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values ('55555555-5555-4555-8555-555555555555', 'adult@example.test', '{"name":"Adult","role":"teacher"}', now(), now());

select is(
  (select role from profiles where id = '55555555-5555-4555-8555-555555555555'),
  'student',
  'signup metadata cannot grant a role'
);

select is(
  (select count(*) from private.signup_consents where user_id = '55555555-5555-4555-8555-555555555555'),
  0::bigint,
  'adults need no consent record'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
set local role authenticated;
select throws_ok(
  $$ select count(*) from private.signup_consents $$,
  '42501',
  null,
  'signed-in users cannot read consent records'
);
reset role;

select * from finish();
rollback;

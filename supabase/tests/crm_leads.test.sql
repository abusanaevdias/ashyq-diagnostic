begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(14);

select has_table('public', 'crm_leads', 'CRM leads table exists');
select has_table('public', 'crm_events', 'CRM events table exists');
select has_table('public', 'crm_delivery_entries', 'CRM delivery ledger exists');

select ok(relrowsecurity, relname || ' has RLS enabled')
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('crm_leads', 'crm_events', 'crm_delivery_entries')
order by relname;

select ok(
  not has_table_privilege('anon', 'public.' || relname, 'select'),
  'anon cannot select ' || relname
)
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('crm_leads', 'crm_events', 'crm_delivery_entries')
order by relname;

select ok(
  not has_table_privilege('authenticated', 'public.' || relname, 'select'),
  'authenticated users cannot select ' || relname
)
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('crm_leads', 'crm_events', 'crm_delivery_entries')
order by relname;

set local role service_role;
select lives_ok(
  $$insert into public.crm_leads (run_id, dedupe_key, kind, exam, payload, received_at)
    values ('test-run', 'test-run|contact|77000000000|Test', 'contact', 'ielts',
      '{"kind":"contact","exam":"ielts","runId":"test-run","receivedAt":"2026-09-14T00:00:00.000Z","ip":"127.0.0.1"}',
      '2026-09-14T00:00:00.000Z')$$,
  'service role can insert a lead'
);
select is(
  (select count(*) from public.crm_leads where run_id = 'test-run'),
  1::bigint,
  'service role can read leads'
);
reset role;

select * from finish();
rollback;

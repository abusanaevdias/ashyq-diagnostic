-- Self-assessment snapshots, not exam/certification records. Apply before enabling
-- DIAGNOSTIC_PROFILE_ENABLED. Browser/route use the user's JWT; no service bypass.
begin;
create function public.valid_diagnostic_snapshot(value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare q jsonb; tag jsonb; expected integer; correct_count integer := 0;
begin
  if jsonb_typeof(value) is distinct from 'object' then return false; end if;
  if (value - array['version','source','runId','exam','finishedAt','elapsedMs','target','band','correct','total','questions']) <> '{}'::jsonb then return false; end if;
  if (value->'version' = '1'::jsonb and value->>'source' = 'self-assessment'
    and value->>'exam' in ('sat','ielts') and jsonb_typeof(value->'runId') = 'string' and value->>'runId' ~ '^[a-zA-Z0-9-]{12,90}$'
    and jsonb_typeof(value->'finishedAt') = 'number' and (value->>'finishedAt')::numeric between 1704067200000 and 4102444800000
    and (value->>'finishedAt')::numeric = trunc((value->>'finishedAt')::numeric)
    and jsonb_typeof(value->'elapsedMs') = 'number' and (value->>'elapsedMs')::numeric between 0 and 604800000
    and jsonb_typeof(value->'target') in ('string','null')
    and jsonb_typeof(value->'band') = 'string' and length(value->>'band') between 1 and 80
    and jsonb_typeof(value->'correct') = 'number'
    and jsonb_typeof(value->'total') = 'number'
    and jsonb_typeof(value->'questions') = 'array') is not true then return false; end if;
  expected := case value->>'exam' when 'ielts' then 12 else 16 end;
  if ((value->>'total')::integer = expected and jsonb_array_length(value->'questions') = expected
    and (value->>'correct')::integer between 0 and expected) is not true then return false; end if;
  for q in select * from jsonb_array_elements(value->'questions') loop
    if jsonb_typeof(q) is distinct from 'object' then return false; end if;
    if (q - array['id','section','skill','tags','prompt','answer','answerLabel','expectedLabel','correct','answered']) <> '{}'::jsonb then return false; end if;
    if (jsonb_typeof(q->'id') = 'string' and length(q->>'id') between 1 and 100
      and q->>'section' in ('reading','listening','rw','math')
      and jsonb_typeof(q->'skill') = 'string' and length(q->>'skill') <= 500
      and jsonb_typeof(q->'prompt') = 'string' and length(q->>'prompt') <= 3000
      and jsonb_typeof(q->'answerLabel') = 'string' and length(q->>'answerLabel') <= 3000
      and jsonb_typeof(q->'expectedLabel') = 'string' and length(q->>'expectedLabel') <= 3000
      and jsonb_typeof(q->'tags') = 'array' and jsonb_array_length(q->'tags') <= 20
      and jsonb_typeof(q->'correct') = 'boolean' and jsonb_typeof(q->'answered') = 'boolean'
      and jsonb_typeof(q->'answer') in ('string','null') and coalesce(length(q->>'answer'),0) <= 300) is not true then return false; end if;
    for tag in select * from jsonb_array_elements(q->'tags') loop
      if jsonb_typeof(tag) is distinct from 'string' or length(tag::text) > 200 then return false; end if;
    end loop;
    if (q->>'correct')::boolean then correct_count := correct_count + 1; end if;
  end loop;
  return correct_count = (value->>'correct')::integer and octet_length(value::text) <= 40000;
exception when others then return false;
end;
$$;
create table public.diagnostic_snapshots (
  run_id text primary key check (run_id ~ '^[a-zA-Z0-9-]{12,90}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  finished_at timestamptz not null,
  created_at timestamptz not null default now(),
  snapshot jsonb not null check (public.valid_diagnostic_snapshot(snapshot) is true and (snapshot->>'runId' = run_id) is true)
);
create index diagnostic_snapshots_owner_date on public.diagnostic_snapshots(owner_id, finished_at desc);
alter table public.diagnostic_snapshots enable row level security;
alter table public.diagnostic_snapshots force row level security;
revoke all on public.diagnostic_snapshots from anon, authenticated;
grant select, insert, delete on public.diagnostic_snapshots to authenticated;
create policy diagnostic_read_own on public.diagnostic_snapshots for select to authenticated using ((select auth.uid()) = owner_id);
create policy diagnostic_insert_own on public.diagnostic_snapshots for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy diagnostic_delete_own on public.diagnostic_snapshots for delete to authenticated using ((select auth.uid()) = owner_id);
-- No UPDATE grant/policy; globally unique run_id prevents attaching the same
-- guest run to another account. Users may delete their own self-assessments.
comment on table public.diagnostic_snapshots is 'Private immutable self-assessment baselines. Not verified learner achievements. No lead/contact/UTM payload.';
commit;

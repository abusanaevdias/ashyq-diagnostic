create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  run_id text not null check (length(run_id) between 1 and 64),
  dedupe_key text not null check (length(dedupe_key) between 1 and 200),
  kind text not null check (kind in ('result', 'contact', 'whatsapp', 'season')),
  exam text not null check (exam in ('sat', 'ielts')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  received_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists crm_leads_dedupe_idx on public.crm_leads(dedupe_key, received_at desc);
create index if not exists crm_leads_run_idx on public.crm_leads(run_id, received_at);

create table if not exists public.crm_events (
  id uuid primary key,
  run_id text not null check (length(run_id) between 1 and 64),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null
);
create index if not exists crm_events_run_idx on public.crm_events(run_id, created_at);

create table if not exists public.crm_delivery_entries (
  id uuid primary key,
  run_id text not null check (length(run_id) between 1 and 64),
  dedupe_key text not null check (length(dedupe_key) between 1 and 200),
  channel text not null check (channel in ('telegram', 'webhook')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null
);
create index if not exists crm_delivery_run_idx on public.crm_delivery_entries(run_id, updated_at);

alter table public.crm_leads enable row level security;
alter table public.crm_events enable row level security;
alter table public.crm_delivery_entries enable row level security;
revoke all on public.crm_leads, public.crm_events, public.crm_delivery_entries from public, anon, authenticated;
grant select, insert on public.crm_leads, public.crm_events, public.crm_delivery_entries to service_role;


-- ИИ ведёт Threads @ashyqedu (THREADS-BOT-001).
-- threads_auth — один long-lived токен Threads (живёт 60 дней, бот продлевает сам).
-- threads_drafts — всё, на что бот посмотрел: уникальный target_id не даёт ответить
-- дважды, одобренные/исправленные/отклонённые черновики — примеры стиля для ИИ.

create table if not exists public.threads_auth (
  id smallint primary key default 1 check (id = 1),
  user_id text not null,
  username text not null,
  access_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.threads_drafts (
  id uuid primary key default gen_random_uuid(),
  target_id text not null unique,
  kind text not null check (kind in ('reply', 'mention', 'search')),
  status text not null check (status in ('writing', 'skipped', 'pending', 'publishing', 'published', 'rejected', 'failed')),
  author text not null default '',
  target_text text not null default '',
  context text,
  permalink text,
  draft text,
  final_text text,
  error text,
  tg_message_id bigint,
  decided_by text,
  created_at timestamptz not null default now()
);
create index if not exists threads_drafts_status_idx on public.threads_drafts(status, created_at desc);
create index if not exists threads_drafts_tg_idx on public.threads_drafts(tg_message_id);

alter table public.threads_auth enable row level security;
alter table public.threads_drafts enable row level security;
revoke all on public.threads_auth, public.threads_drafts from public, anon, authenticated;
grant select, insert, update on public.threads_auth, public.threads_drafts to service_role;

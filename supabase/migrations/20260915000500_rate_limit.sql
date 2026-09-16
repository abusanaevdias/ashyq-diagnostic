-- Общий лимит заявок (LEAD-RATELIMIT-001). Счётчик в памяти работал только в
-- пределах одного инстанса; на Vercel их много, поэтому лимит почти не срабатывал.
-- Здесь один счётчик на всех: fixed-window по ключу (например lead:ip:<ip>).

create schema if not exists private;

create table if not exists private.rate_limits (
  key text primary key,
  count integer not null default 0,
  expires_at timestamptz not null
);
create index if not exists rate_limits_expires_idx on private.rate_limits(expires_at);

-- Возвращает true, если запрос в пределах лимита (можно пропустить), иначе false.
-- Одна атомарная операция insert…on conflict: гонок между инстансами нет.
create or replace function public.check_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  -- самоочистка: истёкшие окна не накапливаются, отдельный cron не нужен
  delete from private.rate_limits where expires_at < now();

  insert into private.rate_limits as r (key, count, expires_at)
  values (p_key, 1, now() + make_interval(secs => greatest(p_window_seconds, 1)))
  on conflict (key) do update set count = r.count + 1
  returning r.count into current_count;

  return current_count <= greatest(p_max, 1);
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
grant select, insert, update, delete on private.rate_limits to service_role;

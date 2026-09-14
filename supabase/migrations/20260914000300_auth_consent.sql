-- Регистрация по почте и паролю (SUPABASE-AUTH-001, решения пользователя 2026-09-14):
-- роль нового аккаунта всегда student (metadata роль не задаёт — её выдаёт админ),
-- несовершеннолетний регистрируется только с согласием родителя: без него БД не
-- создаст пользователя. Факт согласия хранится в private — через API его не
-- прочитать (profiles видят все вошедшие, а статус ребёнка — не их дело).

create table if not exists private.signup_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_minor boolean not null,
  guardian_consent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint signup_consents_minor_needs_consent check (not is_minor or guardian_consent_at is not null)
);
revoke all on private.signup_consents from public, anon, authenticated;

-- «Роли выдаёт админ»: кроме Studio, это делает серверный код с service role
-- (он обходит RLS, но без явных привилегий на таблицу получает 42501).
grant select, update on public.profiles to service_role;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  requested_avatar text;
  minor boolean;
begin
  requested_avatar := new.raw_user_meta_data ->> 'avatar_color';
  minor := coalesce(new.raw_user_meta_data ->> 'is_minor', 'false') = 'true';
  if minor and coalesce(new.raw_user_meta_data ->> 'guardian_consent', 'false') <> 'true' then
    raise exception 'guardian consent is required for minors' using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, display_name, avatar_color)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Ученик'
    ),
    case when requested_avatar in ('red', 'red-deep', 'ink', 'dark-warm')
      then requested_avatar else 'red' end
  )
  on conflict (id) do nothing;

  if minor then
    insert into private.signup_consents (user_id, is_minor, guardian_consent_at)
    values (new.id, true, now())
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

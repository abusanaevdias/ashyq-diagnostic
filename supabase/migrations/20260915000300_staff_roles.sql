-- Роли на сайте (STAFF-ROLES-001): admin и manager меняют роль ученик/учитель/автор
-- из кабинета (/me/roles). Выдать admin/manager и трогать их аккаунты по-прежнему
-- можно только в SQL Editor: менеджер не повысит себя и не снимет админа.

-- manager вводит CRM-PROD-001 (20260915000200); повтор идемпотентен — порядок слияния не важен
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'teacher', 'author', 'admin', 'manager'));

create or replace function public.staff_list_users()
returns table (id uuid, display_name text, email text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if coalesce((select private.current_role()) not in ('admin', 'manager'), true) then
    raise exception 'Only admins and managers can manage roles';
  end if;
  return query
    select p.id, p.display_name, u.email::text, p.role, u.created_at
    from public.profiles p join auth.users u on u.id = p.id
    order by u.created_at desc;
end;
$$;

create or replace function public.staff_set_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = ''
as $$
declare target_role text;
begin
  if coalesce((select private.current_role()) not in ('admin', 'manager'), true) then
    raise exception 'Only admins and managers can manage roles';
  end if;
  if p_role is null or p_role not in ('student', 'teacher', 'author') then
    raise exception 'Only student, teacher or author can be set on the site';
  end if;
  select role into target_role from public.profiles where id = p_user_id;
  if target_role is null then raise exception 'User not found'; end if;
  if target_role in ('admin', 'manager') then raise exception 'Staff roles are changed only in SQL Editor'; end if;
  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

revoke all on function public.staff_list_users(), public.staff_set_role(uuid, text) from public, anon;
grant execute on function public.staff_list_users(), public.staff_set_role(uuid, text) to authenticated;

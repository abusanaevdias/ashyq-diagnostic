-- Персональный вход в CRM (CRM-PROD-001): роль manager — сотрудник, который
-- работает с заявками в /crm. Выдаёт её только админ (SQL Editor или service role):
-- триггер регистрации всегда ставит student, а authenticated не может менять
-- колонку role (grant update только на display_name, avatar_color, updated_at).
-- Учебных прав у manager нет: политики LMS и сезона проверяют student/teacher/author/admin.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'teacher', 'author', 'admin', 'manager'));

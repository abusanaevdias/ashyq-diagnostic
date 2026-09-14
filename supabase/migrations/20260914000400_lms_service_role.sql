-- Учебный слой на Supabase (SUPABASE-LMS-001): серверные операции админа —
-- модерация, выгрузка и удаление данных по запросу — идут через service role.
-- Он обходит RLS, но без явных привилегий на таблицы получает 42501.
-- Браузер ходит только с anon/authenticated: их права не меняются.
grant select, insert, update, delete on public.classes, public.class_members, public.lessons,
  public.assignments, public.submissions, public.submission_comments, public.blog_posts
  to service_role;

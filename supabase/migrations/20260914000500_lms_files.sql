-- Файлы уроков и сдач в Supabase Storage (SUPABASE-FILES-001).
-- Приватный bucket, лимит 2 МБ на файл — как в ТЗ учебного слоя.
-- Путь объекта: <uid владельца>/<id>-<имя>. Загружать можно только в свою папку;
-- читать — владельцу и «соседу по классу»: учителю файлы его учеников и ученику
-- файлы его учителя (материалы уроков). Остальным — ничего, ссылки подписанные.

insert into storage.buckets (id, name, public, file_size_limit)
values ('lms-files', 'lms-files', false, 2097152)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create or replace function private.can_read_lms_file(owner_folder text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select owner_folder = (select auth.uid())::text
    or exists (
      select 1
      from public.classes c
      join public.class_members m on m.class_id = c.id
      where (c.teacher_id = (select auth.uid()) and m.student_id::text = owner_folder)
         or (c.teacher_id::text = owner_folder and m.student_id = (select auth.uid()))
    )
$$;
revoke all on function private.can_read_lms_file(text) from public, anon;
grant execute on function private.can_read_lms_file(text) to authenticated;

drop policy if exists lms_files_insert_own on storage.objects;
create policy lms_files_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'lms-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists lms_files_read on storage.objects;
create policy lms_files_read on storage.objects for select to authenticated
using (bucket_id = 'lms-files' and (select private.can_read_lms_file((storage.foldername(name))[1])));

drop policy if exists lms_files_delete_own on storage.objects;
create policy lms_files_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'lms-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

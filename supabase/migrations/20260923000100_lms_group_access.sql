-- Закрыть межгрупповые утечки профилей, работ и файлов LMS.

create or replace function private.can_manage_class(target_class uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select private.is_teacher()) and exists (
    select 1 from public.classes
    where id = target_class and teacher_id = (select auth.uid())
  )
$$;

create or replace function private.can_view_class(target_class uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select private.can_manage_class(target_class)) or (
    (select private.current_role()) = 'student'
    and exists (
      select 1 from public.class_members
      where class_id = target_class and student_id = (select auth.uid())
    )
  )
$$;

create or replace function private.can_view_profile(target_user uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select target_user = (select auth.uid()) or exists (
    select 1
    from public.classes c
    where (
      (select private.can_manage_class(c.id))
      and exists (
        select 1 from public.class_members target_member
        where target_member.class_id = c.id and target_member.student_id = target_user
      )
    ) or (
      (select private.current_role()) = 'student'
      and c.teacher_id = target_user
      and exists (
        select 1 from public.class_members viewer_member
        where viewer_member.class_id = c.id and viewer_member.student_id = (select auth.uid())
      )
    ) or (
      (select private.current_role()) = 'student'
      and exists (
        select 1 from public.class_members viewer_member
        where viewer_member.class_id = c.id and viewer_member.student_id = (select auth.uid())
      )
      and exists (
        select 1 from public.class_members target_member
        where target_member.class_id = c.id and target_member.student_id = target_user
      )
    )
  )
$$;

revoke all on function private.can_view_profile(uuid) from public, anon;
grant execute on function private.can_view_profile(uuid) to authenticated;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
using ((select private.can_view_profile(id)));

drop policy if exists comments_create on public.submission_comments;
create policy comments_create on public.submission_comments for insert to authenticated with check (
  author_id = (select auth.uid())
  and (
    ((select private.current_role()) = 'student' and author_role = 'student')
    or ((select private.current_role()) in ('teacher', 'admin') and author_role = 'teacher')
  )
  and (select private.can_view_submission(submission_id))
);

create or replace function public.grade_submission(p_submission_id uuid, p_grade integer)
returns public.submissions language plpgsql security definer set search_path = ''
as $$
declare target public.submissions%rowtype; maximum integer;
begin
  select s.* into target
  from public.submissions s join public.assignments a on a.id = s.assignment_id
  where s.id = p_submission_id and (select private.can_manage_class(a.class_id));
  if target.id is null then raise exception 'Submission not found'; end if;

  -- Сериализовать выставление оценки с изменением максимума задания.
  select max_points into maximum
  from public.assignments where id = target.assignment_id for update;
  if p_grade is null or p_grade < 0 or p_grade > maximum then
    raise exception 'Grade is outside assignment range';
  end if;
  update public.submissions set grade = p_grade, status = 'graded'
  where id = p_submission_id returning * into target;
  return target;
end;
$$;
revoke all on function public.grade_submission(uuid, integer) from public, anon;
grant execute on function public.grade_submission(uuid, integer) to authenticated;

create or replace function private.prevent_assignment_max_below_grade()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare highest_grade integer;
begin
  select max(grade) into highest_grade
  from public.submissions
  where assignment_id = new.id and status = 'graded' and grade is not null;
  if highest_grade is not null and new.max_points < highest_grade then
    raise exception 'Maximum points cannot be below an existing grade';
  end if;
  return new;
end;
$$;
revoke all on function private.prevent_assignment_max_below_grade() from public, anon, authenticated;
drop trigger if exists prevent_assignment_max_below_grade on public.assignments;
create trigger prevent_assignment_max_below_grade
before update of max_points on public.assignments
for each row execute function private.prevent_assignment_max_below_grade();

create or replace function private.lms_file_is_referenced(object_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.lessons l
    where l.materials @> jsonb_build_array(jsonb_build_object('url', 'sb-file:' || object_name))
  ) or exists (
    select 1 from public.submissions s
    where s.attachments @> jsonb_build_array(jsonb_build_object('url', 'sb-file:' || object_name))
  )
$$;

create or replace function private.can_read_lms_file(owner_folder text, object_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select owner_folder = (select auth.uid())::text
    or exists (
      select 1
      from public.lessons l
      join public.classes c on c.id = l.class_id
      where c.teacher_id::text = owner_folder
        and l.materials @> jsonb_build_array(jsonb_build_object('url', 'sb-file:' || object_name))
        and (select private.can_view_class(l.class_id))
    )
    or exists (
      select 1
      from public.submissions s
      join public.assignments a on a.id = s.assignment_id
      where s.student_id::text = owner_folder
        and s.attachments @> jsonb_build_array(jsonb_build_object('url', 'sb-file:' || object_name))
        and (select private.can_manage_class(a.class_id))
    )
$$;

revoke all on function private.lms_file_is_referenced(text) from public, anon;
grant execute on function private.lms_file_is_referenced(text) to authenticated;
revoke all on function private.can_read_lms_file(text, text) from public, anon;
grant execute on function private.can_read_lms_file(text, text) to authenticated;

drop policy if exists lms_files_read on storage.objects;
create policy lms_files_read on storage.objects for select to authenticated
using (
  bucket_id = 'lms-files'
  and (select private.can_read_lms_file((storage.foldername(name))[1], name))
);

drop policy if exists lms_files_delete_own on storage.objects;
create policy lms_files_delete_own on storage.objects for delete to authenticated
using (
  bucket_id = 'lms-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not (select private.lms_file_is_referenced(name))
);

drop function if exists private.can_read_lms_file(text);

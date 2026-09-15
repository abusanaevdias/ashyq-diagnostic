-- Самооценка понятности урока (LESSON-RATING-001): ученик класса выбирает один из
-- 4 уровней «если тема попадётся в тесте…»; учитель класса видит оценки учеников.
-- Одна строка на пару урок × ученик, повторная оценка — upsert.

create table if not exists public.lesson_ratings (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  level smallint not null check (level between 1 and 4),
  rated_at timestamptz not null default now(),
  primary key (lesson_id, student_id)
);
create index if not exists lesson_ratings_student_idx on public.lesson_ratings(student_id);

alter table public.lesson_ratings enable row level security;
revoke all on public.lesson_ratings from anon, authenticated;
grant select, insert, update on public.lesson_ratings to authenticated;
grant select, insert, update, delete on public.lesson_ratings to service_role;

drop policy if exists lesson_ratings_read on public.lesson_ratings;
create policy lesson_ratings_read on public.lesson_ratings for select to authenticated using (
  student_id = (select auth.uid()) or exists (
    select 1 from public.lessons l where l.id = lesson_id and (select private.can_manage_class(l.class_id))
  )
);

-- upsert = insert + update: оба пути требуют, чтобы писал сам ученик класса этого урока
drop policy if exists lesson_ratings_create on public.lesson_ratings;
create policy lesson_ratings_create on public.lesson_ratings for insert to authenticated with check (
  (select private.current_role()) = 'student' and student_id = (select auth.uid()) and exists (
    select 1 from public.lessons l where l.id = lesson_id and (select private.can_view_class(l.class_id))
  )
);
drop policy if exists lesson_ratings_update on public.lesson_ratings;
create policy lesson_ratings_update on public.lesson_ratings for update to authenticated
using (student_id = (select auth.uid()))
with check (
  (select private.current_role()) = 'student' and student_id = (select auth.uid()) and exists (
    select 1 from public.lessons l where l.id = lesson_id and (select private.can_view_class(l.class_id))
  )
);

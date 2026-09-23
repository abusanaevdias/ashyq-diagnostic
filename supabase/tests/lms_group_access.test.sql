begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(22);

insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at) values
  ('a1111111-1111-4111-8111-111111111111', 'group-teacher-a@example.test', '{"name":"Teacher A"}', now(), now()),
  ('a2222222-2222-4222-8222-222222222222', 'group-teacher-b@example.test', '{"name":"Teacher B"}', now(), now()),
  ('b1111111-1111-4111-8111-111111111111', 'group-student-a@example.test', '{"name":"Student A"}', now(), now()),
  ('b2222222-2222-4222-8222-222222222222', 'group-student-b@example.test', '{"name":"Student B"}', now(), now());

update public.profiles set role = 'teacher' where id = 'a1111111-1111-4111-8111-111111111111';
update public.profiles set role = 'admin' where id = 'a2222222-2222-4222-8222-222222222222';

insert into public.classes (id, title, subject, teacher_id, invite_code) values
  ('c1111111-1111-4111-8111-111111111111', 'Group A', 'IELTS', 'a1111111-1111-4111-8111-111111111111', 'GROUPA01'),
  ('c2222222-2222-4222-8222-222222222222', 'Group B', 'SAT', 'a2222222-2222-4222-8222-222222222222', 'GROUPB01');
insert into public.class_members (class_id, student_id) values
  ('c1111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111111'),
  ('c2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222');
insert into public.assignments (id, class_id, teacher_id, title, due_at, max_points) values
  ('d1111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'Task A', now() + interval '1 day', 10),
  ('d2222222-2222-4222-8222-222222222222', 'c2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 'Task B', now() + interval '1 day', 10);
insert into public.lessons (id, class_id, title) values
  ('e1111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111', 'Lesson A'),
  ('e2222222-2222-4222-8222-222222222222', 'c2222222-2222-4222-8222-222222222222', 'Lesson B');
insert into public.submissions (id, assignment_id, student_id, content, status, grade) values
  ('f1111111-1111-4111-8111-111111111111', 'd1111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111111', 'Answer A', 'graded', 8),
  ('f2222222-2222-4222-8222-222222222222', 'd2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222', 'Answer B', 'graded', 7);
insert into public.submission_comments (submission_id, author_id, author_role, body) values
  ('f1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'teacher', 'Feedback A'),
  ('f2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 'teacher', 'Feedback B');

select set_config('request.jwt.claim.sub', 'b1111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select is((select count(*) from public.classes), 1::bigint, 'student A sees only own class');
select is((select count(*) from public.classes where id = 'c2222222-2222-4222-8222-222222222222'), 0::bigint, 'student A cannot read group B');
select is((select count(*) from public.profiles), 2::bigint, 'student A sees self and own teacher');
select is((select count(*) from public.profiles where id in ('a2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222')), 0::bigint, 'student A cannot enumerate group B profiles');
select is((select count(*) from public.submissions), 1::bigint, 'student A sees own result');
select is((select count(*) from public.submissions where id = 'f2222222-2222-4222-8222-222222222222'), 0::bigint, 'student A cannot read another group result');
select is((select count(*) from public.submission_comments where submission_id = 'f2222222-2222-4222-8222-222222222222'), 0::bigint, 'student A cannot read another group thread');
reset role;

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select is((select count(*) from public.classes), 1::bigint, 'teacher A sees only own class');
select is((select count(*) from public.classes where id = 'c2222222-2222-4222-8222-222222222222'), 0::bigint, 'teacher A cannot read group B');
select is((select count(*) from public.profiles), 2::bigint, 'teacher A sees self and own student');
select is((select count(*) from public.profiles where id in ('a2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222')), 0::bigint, 'teacher A cannot enumerate group B profiles');
select is((select count(*) from public.submissions), 1::bigint, 'teacher A sees only own class work');
select is((select count(*) from public.submissions where id = 'f2222222-2222-4222-8222-222222222222'), 0::bigint, 'teacher A cannot read another teacher work');
select is((select count(*) from public.submission_comments where submission_id = 'f2222222-2222-4222-8222-222222222222'), 0::bigint, 'teacher A cannot read another teacher thread');
select throws_ok($$select public.grade_submission('f2222222-2222-4222-8222-222222222222', 10)$$, 'P0001', 'Submission not found', 'teacher A cannot grade another teacher work');
select throws_ok($$select public.grade_submission('f1111111-1111-4111-8111-111111111111', null)$$, 'P0001', 'Grade is outside assignment range', 'null grade is rejected');
select throws_ok($$update public.assignments set max_points = 7 where id = 'd1111111-1111-4111-8111-111111111111'$$, 'P0001', 'Maximum points cannot be below an existing grade', 'maximum cannot fall below a published grade');
reset role;

select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
set local role authenticated;
select is((select count(*) from public.classes), 1::bigint, 'admin keeps teacher access to own class');
select lives_ok($$insert into public.submission_comments (submission_id, author_id, author_role, body) values ('f2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 'teacher', 'Admin feedback')$$, 'admin may review as teacher');
reset role;

update public.profiles set role = 'student' where id = 'a1111111-1111-4111-8111-111111111111';
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select is((select count(*) from public.classes), 0::bigint, 'demoted teacher loses class access');
select is((select count(*) from public.profiles), 1::bigint, 'demoted teacher sees only own profile');
update public.lessons set title = 'Unauthorized edit' where id = 'e1111111-1111-4111-8111-111111111111';
reset role;
select is((select title from public.lessons where id = 'e1111111-1111-4111-8111-111111111111'), 'Lesson A', 'demoted teacher cannot edit old class content');

select * from finish();
rollback;

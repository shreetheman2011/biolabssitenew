-- Grades were unique per (assignment_id, student_id), so grading a second attempt silently
-- overwrote the first attempt's grade, and the app hid "try again" the moment any grade
-- existed. Students should be able to keep attempting after a grade is posted, and teachers
-- should be able to grade each attempt independently. Move the uniqueness to submission_id,
-- which is already the row each grade is validated against.

alter table public.grades drop constraint grades_assignment_id_student_id_key;
alter table public.grades add constraint grades_submission_id_key unique (submission_id);

comment on table public.grades is 'One row per submission (attempt). A student may have multiple graded attempts on the same assignment; re-grading a specific attempt is an upsert on submission_id.';

-- Roster view: show the latest attempt's status and its own grade (if graded), rather than
-- joining grades by assignment+student, which no longer uniquely identifies one row.
create or replace view public.gradebook_entries
with (security_invoker = true)
as
with latest_submission as (
  select distinct on (s.assignment_id, s.student_id)
    s.assignment_id, s.student_id, s.id as submission_id, s.status, s.submitted_at
  from public.submissions s
  order by s.assignment_id, s.student_id, s.attempt_number desc
)
select
  a.id as assignment_id,
  a.class_id,
  a.title as assignment_title,
  a.grading_type,
  a.max_score,
  a.rubric_criteria,
  a.allow_multiple_attempts,
  a.due_at,
  ce.student_id,
  p.full_name as student_name,
  p.email as student_email,
  (
    select count(*) from public.submissions s
    where s.assignment_id = a.id and s.student_id = ce.student_id and s.status = 'submitted'
  ) as attempt_count,
  ls.submission_id as latest_submission_id,
  ls.status as latest_submission_status,
  ls.submitted_at as latest_submitted_at,
  g.id as grade_id,
  g.submission_id as graded_submission_id,
  g.numeric_score,
  g.rubric_scores,
  g.feedback,
  g.graded_at,
  g.notified_at
from public.assignments a
join public.class_enrollments ce on ce.class_id = a.class_id
join public.profiles p on p.id = ce.student_id
left join latest_submission ls on ls.assignment_id = a.id and ls.student_id = ce.student_id
left join public.grades g on g.submission_id = ls.submission_id;

comment on view public.gradebook_entries is 'One row per assignment x enrolled student, with the latest attempt and that attempt''s own grade (if graded) joined in. Inherits RLS from base tables via security_invoker.';

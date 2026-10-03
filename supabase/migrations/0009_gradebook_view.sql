-- Convenience view so gradebook/grading screens don't each hand-roll the same join.
-- security_invoker = true means it runs with the querying user's own RLS, not the view
-- owner's privileges, so it's safe to expose through the normal authenticated client.
create view public.gradebook_entries
with (security_invoker = true)
as
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
  (
    select s.id from public.submissions s
    where s.assignment_id = a.id and s.student_id = ce.student_id
    order by s.attempt_number desc limit 1
  ) as latest_submission_id,
  (
    select s.status from public.submissions s
    where s.assignment_id = a.id and s.student_id = ce.student_id
    order by s.attempt_number desc limit 1
  ) as latest_submission_status,
  (
    select s.submitted_at from public.submissions s
    where s.assignment_id = a.id and s.student_id = ce.student_id
    order by s.attempt_number desc limit 1
  ) as latest_submitted_at,
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
left join public.grades g on g.assignment_id = a.id and g.student_id = ce.student_id;

comment on view public.gradebook_entries is 'One row per assignment x enrolled student, with latest-attempt + grade info joined in. Inherits RLS from base tables via security_invoker.';

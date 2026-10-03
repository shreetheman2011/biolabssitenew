create table public.grades (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  submission_id uuid not null references public.submissions (id) on delete restrict,
  graded_by uuid not null references public.profiles (id),
  numeric_score numeric(6, 2),
  rubric_scores jsonb,
  feedback text,
  graded_at timestamptz not null default now(),
  notified_at timestamptz,

  unique (assignment_id, student_id)
);

create index grades_student_id_idx on public.grades (student_id);

comment on table public.grades is 'One row per assignment+student. Re-grading is an upsert (ON CONFLICT DO UPDATE), which is also what makes "every insert/update fires a notification" correct.';

-- Keep graded_at fresh on every (re)grade, and ensure the referenced submission actually
-- belongs to this assignment+student (defense in depth beyond app-level checks).
create or replace function public.validate_and_stamp_grade()
returns trigger
language plpgsql
as $$
declare
  v_sub_assignment uuid;
  v_sub_student uuid;
begin
  select assignment_id, student_id into v_sub_assignment, v_sub_student
    from public.submissions where id = new.submission_id;

  if v_sub_assignment is distinct from new.assignment_id or v_sub_student is distinct from new.student_id then
    raise exception 'graded submission must belong to the same assignment and student';
  end if;

  new.graded_at := now();
  return new;
end;
$$;

create trigger grades_validate_and_stamp
  before insert or update on public.grades
  for each row
  execute function public.validate_and_stamp_grade();

-- Delivery-tracking table for the grade -> email pipeline (written only by the notify-grade
-- Edge Function using the service-role key; see supabase/functions/notify-grade).
create table public.grade_notifications (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references public.grades (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  error text,
  attempted_at timestamptz not null default now()
);

create index grade_notifications_grade_id_idx on public.grade_notifications (grade_id);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  lab_template_id uuid not null references public.lab_templates (id) on delete restrict,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  instructions text,
  status text not null default 'draft' check (status in ('draft', 'posted')),
  due_at timestamptz,
  allow_multiple_attempts boolean not null default false,
  max_attempts int check (max_attempts is null or max_attempts > 0),
  grading_type text not null check (grading_type in ('numeric', 'rubric')),
  max_score numeric(6, 2),
  rubric_criteria jsonb,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint grading_config_matches_type check (
    (grading_type = 'numeric' and max_score is not null and rubric_criteria is null)
    or
    (grading_type = 'rubric' and rubric_criteria is not null and max_score is null)
  ),
  constraint attempt_cap_requires_multiple check (
    (allow_multiple_attempts = false and max_attempts is null) or allow_multiple_attempts = true
  )
);

create index assignments_class_status_idx on public.assignments (class_id, status);
create index assignments_teacher_id_idx on public.assignments (teacher_id);

comment on table public.assignments is 'The posting of a lab_template to a class. Drafts are only visible to the owning teacher.';

create trigger assignments_set_updated_at
  before update on public.assignments
  for each row
  execute function public.set_updated_at();

-- Stamp posted_at exactly once, the moment status flips draft -> posted. Never trust a client-supplied timestamp.
create or replace function public.stamp_posted_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'posted' and old.status = 'draft' then
    new.posted_at := now();
  end if;
  return new;
end;
$$;

create trigger assignments_stamp_posted_at
  before update on public.assignments
  for each row
  execute function public.stamp_posted_at();

-- Belt-and-suspenders: block changing grading config once any grade exists for this assignment,
-- so numeric/rubric scores already recorded never drift out of sync with the scale they were graded on.
create or replace function public.prevent_grading_config_change_after_grades()
returns trigger
language plpgsql
as $$
begin
  if (new.grading_type, new.max_score, new.rubric_criteria) is distinct from (old.grading_type, old.max_score, old.rubric_criteria) then
    if exists (select 1 from public.grades where assignment_id = new.id) then
      raise exception 'cannot change grading configuration after grades have been entered for this assignment';
    end if;
  end if;
  return new;
end;
$$;

create trigger assignments_lock_grading_config
  before update on public.assignments
  for each row
  execute function public.prevent_grading_config_change_after_grades();

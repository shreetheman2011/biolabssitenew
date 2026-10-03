create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  attempt_number int not null check (attempt_number > 0),
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  sim_state jsonb not null default '{}'::jsonb,
  journal_responses jsonb not null default '{"version": 1, "answers": {}}'::jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),

  unique (assignment_id, student_id, attempt_number)
);

create index submissions_assignment_student_idx on public.submissions (assignment_id, student_id);

comment on table public.submissions is 'One row per attempt. Editable only while status = in_progress (enforced by RLS, see 0007).';

create trigger submissions_set_updated_at
  before update on public.submissions
  for each row
  execute function public.set_updated_at();

-- Race-safe attempt cap: re-checks the assignment's attempt policy at insert time, counting
-- only submitted attempts so an abandoned in_progress row never burns an attempt slot.
create or replace function public.enforce_attempt_limit()
returns trigger
language plpgsql
as $$
declare
  v_allow_multiple boolean;
  v_max_attempts int;
  v_submitted_count int;
begin
  select allow_multiple_attempts, max_attempts
    into v_allow_multiple, v_max_attempts
    from public.assignments
    where id = new.assignment_id;

  select count(*) into v_submitted_count
    from public.submissions
    where assignment_id = new.assignment_id
      and student_id = new.student_id
      and status = 'submitted';

  if not v_allow_multiple and v_submitted_count >= 1 then
    raise exception 'this assignment only allows a single attempt';
  end if;

  if v_allow_multiple and v_max_attempts is not null and v_submitted_count >= v_max_attempts then
    raise exception 'maximum number of attempts (%) reached for this assignment', v_max_attempts;
  end if;

  return new;
end;
$$;

create trigger submissions_enforce_attempt_limit
  before insert on public.submissions
  for each row
  execute function public.enforce_attempt_limit();

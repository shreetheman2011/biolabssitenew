-- Enable RLS on every table, default-deny, explicit per-operation policies.

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.lab_templates enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.grades enable row level security;
alter table public.grade_notifications enable row level security;

-- Helper: is the current user a teacher who owns this class?
create or replace function public.is_teacher_of_class(p_class_id uuid)
returns boolean
language sql
security invoker
stable
as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id and c.teacher_id = auth.uid()
  );
$$;

-- Helper: is the current user a student enrolled in this class?
create or replace function public.is_enrolled_in_class(p_class_id uuid)
returns boolean
language sql
security invoker
stable
as $$
  select exists (
    select 1 from public.class_enrollments ce
    where ce.class_id = p_class_id and ce.student_id = auth.uid()
  );
$$;

-- ============================= profiles =============================

create policy profiles_select_own
  on public.profiles for select
  using (id = auth.uid());

create policy profiles_select_enrolled_students_as_teacher
  on public.profiles for select
  using (
    role = 'student'
    and exists (
      select 1 from public.class_enrollments ce
      join public.classes c on c.id = ce.class_id
      where ce.student_id = profiles.id and c.teacher_id = auth.uid()
    )
  );

create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid());

-- No INSERT/DELETE policies: profile rows are created only by the handle_new_user trigger
-- (security definer, bypasses RLS) and are never deleted directly by a client.

-- ============================= classes =============================

create policy classes_select_own_as_teacher
  on public.classes for select
  using (teacher_id = auth.uid());

create policy classes_select_enrolled_as_student
  on public.classes for select
  using (public.is_enrolled_in_class(id));

create policy classes_insert_as_teacher
  on public.classes for insert
  with check (
    teacher_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

create policy classes_update_own_as_teacher
  on public.classes for update
  using (teacher_id = auth.uid());

-- No DELETE policy: classes are soft-archived (archived_at), never hard-deleted, to preserve
-- historical assignments/grades. No SELECT-by-join-code policy exists on purpose, see 0008.

-- ========================= class_enrollments =========================

create policy enrollments_select_own_as_student
  on public.class_enrollments for select
  using (student_id = auth.uid());

create policy enrollments_select_as_teacher
  on public.class_enrollments for select
  using (public.is_teacher_of_class(class_id));

create policy enrollments_delete_as_teacher
  on public.class_enrollments for delete
  using (public.is_teacher_of_class(class_id));

create policy enrollments_delete_own_as_student
  on public.class_enrollments for delete
  using (student_id = auth.uid());

-- No INSERT policy: enrollment is created exclusively via join_class_by_code (0008).

-- ============================= lab_templates =============================

create policy lab_templates_select_authenticated
  on public.lab_templates for select
  to authenticated
  using (true);

-- No write policies at all: seeded once via migration, never touched by the app.

-- ============================= assignments =============================

create policy assignments_select_own_as_teacher
  on public.assignments for select
  using (teacher_id = auth.uid());

create policy assignments_select_posted_as_enrolled_student
  on public.assignments for select
  using (
    status = 'posted'
    and public.is_enrolled_in_class(class_id)
  );

create policy assignments_insert_as_teacher
  on public.assignments for insert
  with check (
    teacher_id = auth.uid()
    and exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

create policy assignments_update_own_as_teacher
  on public.assignments for update
  using (teacher_id = auth.uid());

create policy assignments_delete_own_drafts_as_teacher
  on public.assignments for delete
  using (teacher_id = auth.uid() and status = 'draft');

-- ============================= submissions =============================

create policy submissions_select_own_as_student
  on public.submissions for select
  using (student_id = auth.uid());

create policy submissions_select_as_teacher
  on public.submissions for select
  using (
    exists (
      select 1 from public.assignments a
      where a.id = submissions.assignment_id and a.teacher_id = auth.uid()
    )
  );

create policy submissions_insert_as_student
  on public.submissions for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.assignments a
      join public.class_enrollments ce on ce.class_id = a.class_id
      where a.id = submissions.assignment_id
        and a.status = 'posted'
        and ce.student_id = auth.uid()
    )
  );

-- Students may only edit their own submission while it is still in progress; the moment
-- status flips to 'submitted' this policy's USING clause stops matching, so no further
-- client UPDATE can ever reach the row again (this is what makes "no edits after submit" true).
create policy submissions_update_own_in_progress_as_student
  on public.submissions for update
  using (student_id = auth.uid() and status = 'in_progress')
  with check (student_id = auth.uid() and status in ('in_progress', 'submitted'));

-- No DELETE policy for anyone: no take-backs, preserves autosave/attempt history for grading trust.

-- ============================= grades =============================

create policy grades_select_own_as_student
  on public.grades for select
  using (student_id = auth.uid());

create policy grades_select_as_teacher
  on public.grades for select
  using (
    exists (
      select 1 from public.assignments a
      where a.id = grades.assignment_id and a.teacher_id = auth.uid()
    )
  );

create policy grades_insert_as_teacher
  on public.grades for insert
  with check (
    graded_by = auth.uid()
    and exists (
      select 1 from public.assignments a
      where a.id = grades.assignment_id and a.teacher_id = auth.uid()
    )
  );

create policy grades_update_as_teacher
  on public.grades for update
  using (
    exists (
      select 1 from public.assignments a
      where a.id = grades.assignment_id and a.teacher_id = auth.uid()
    )
  )
  with check (
    graded_by = auth.uid()
    and exists (
      select 1 from public.assignments a
      where a.id = grades.assignment_id and a.teacher_id = auth.uid()
    )
  );

-- No DELETE policy, and students get zero write policies at all on this table.

-- ============================= grade_notifications =============================

create policy grade_notifications_select_as_teacher
  on public.grade_notifications for select
  using (
    exists (
      select 1 from public.grades g
      join public.assignments a on a.id = g.assignment_id
      where g.id = grade_notifications.grade_id and a.teacher_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE client policies: written exclusively by the notify-grade Edge
-- Function using the service-role key, which bypasses RLS entirely.

-- Students can see a teacher's profile is a feature, not covered by 0007. That migration added
-- profiles_select_enrolled_students_as_teacher (teacher -> student direction) but nothing letting
-- a student read the profile of a teacher whose class they're enrolled in, so
-- app/(app)/student/classes/[classId]/page.tsx's "Taught by {teacher.full_name}" query returns
-- nothing under RLS.
create policy profiles_select_teacher_of_enrolled_class_as_student
  on public.profiles for select
  using (
    role = 'teacher'
    and exists (
      select 1 from public.classes c
      join public.class_enrollments ce on ce.class_id = c.id
      where c.teacher_id = profiles.id and ce.student_id = auth.uid()
    )
  );

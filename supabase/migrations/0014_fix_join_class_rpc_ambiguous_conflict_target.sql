-- The real bug since 0008: "on conflict (class_id, student_id)" uses bare column names as the
-- conflict target, and those get resolved against both the class_enrollments table columns AND
-- the plpgsql class_id/class_name variables implicitly created by this function's
-- RETURNS TABLE(class_id, class_name) clause, raising "column reference is ambiguous" (42702).
-- 0012 and 0013 both edited the unrelated RETURN QUERY line and never touched this. Fix it by
-- targeting the constraint by name instead of by column list, which has no such ambiguity.
create or replace function public.join_class_by_code(p_join_code text)
returns table (class_id uuid, class_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_class_name text;
  v_archived timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'student') then
    raise exception 'only_students_can_join';
  end if;

  select c.id, c.name, c.archived_at
    into v_class_id, v_class_name, v_archived
    from public.classes c
    where c.join_code = upper(trim(p_join_code));

  if v_class_id is null then
    raise exception 'invalid_code';
  end if;

  if v_archived is not null then
    raise exception 'class_archived';
  end if;

  insert into public.class_enrollments (class_id, student_id)
  values (v_class_id, auth.uid())
  on conflict on constraint class_enrollments_class_id_student_id_key do nothing;

  return query select v_class_id, v_class_name;
end;
$$;

revoke all on function public.join_class_by_code(text) from public;
grant execute on function public.join_class_by_code(text) to authenticated;

-- 0008 returned v_class_id/v_class_name (the local variable names) instead of aliasing them to
-- the declared return columns class_id/class_name, so every caller got back untagged columns and
-- the app's row.class_id lookup was always undefined. Redefine with the correct aliases.
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
  on conflict (class_id, student_id) do nothing;

  return query select v_class_id as class_id, v_class_name as class_name;
end;
$$;

revoke all on function public.join_class_by_code(text) from public;
grant execute on function public.join_class_by_code(text) to authenticated;

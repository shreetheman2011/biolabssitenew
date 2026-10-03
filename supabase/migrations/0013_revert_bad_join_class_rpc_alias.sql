-- 0012 was based on a wrong diagnosis: it aliased the RETURN QUERY SELECT to "as class_id, as
-- class_name", but those names already exist as implicit variables from the RETURNS TABLE(...)
-- declaration, so the alias collided with them and raised "column reference is ambiguous"
-- (42702) on every call. Postgres maps RETURN QUERY results to the declared output columns by
-- position, not by the inner query's own aliases, so the unaliased select was never the bug.
-- Revert to it.
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

  return query select v_class_id, v_class_name;
end;
$$;

revoke all on function public.join_class_by_code(text) from public;
grant execute on function public.join_class_by_code(text) to authenticated;

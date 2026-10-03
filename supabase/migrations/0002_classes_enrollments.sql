create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{6}$'),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index classes_teacher_id_idx on public.classes (teacher_id);

comment on table public.classes is 'A teacher-owned class. join_code is the single active code for both the manual-entry and /join/[code] link flows.';

-- Generates a random 6-char code from an unambiguous alphabet (no 0/O, 1/I/L).
create or replace function public.generate_join_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- Assigns a unique join_code on insert if the caller didn't supply one, retrying on collision.
create or replace function public.assign_join_code()
returns trigger
language plpgsql
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.join_code is not null then
    return new;
  end if;

  loop
    candidate := public.generate_join_code();
    attempts := attempts + 1;
    if not exists (select 1 from public.classes where join_code = candidate) then
      new.join_code := candidate;
      exit;
    end if;
    if attempts > 20 then
      raise exception 'could not generate a unique join code, please retry';
    end if;
  end loop;

  return new;
end;
$$;

create trigger classes_assign_join_code
  before insert on public.classes
  for each row
  execute function public.assign_join_code();

create table public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create index class_enrollments_student_id_idx on public.class_enrollments (student_id);
create index class_enrollments_class_id_idx on public.class_enrollments (class_id);

comment on table public.class_enrollments is 'Enrollment rows are created exclusively via the join_class_by_code RPC (see 0008).';

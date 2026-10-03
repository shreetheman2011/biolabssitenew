-- Extensions needed for UUID generation (usually already enabled on Supabase, safe to re-run)
create extension if not exists pgcrypto;

-- One row per authenticated user, 1:1 with auth.users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App-level profile for every user, 1:1 with auth.users. Role is fixed at signup.';

-- Keep updated_at fresh on any update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Prevent a user from changing their own role after signup via a direct client UPDATE.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role <> old.role then
    raise exception 'role cannot be changed after account creation';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_role_change();

-- Create a profile row automatically whenever a new auth.users row is inserted.
-- Role + full name are passed through signup as user_metadata (set by the app's signup form).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

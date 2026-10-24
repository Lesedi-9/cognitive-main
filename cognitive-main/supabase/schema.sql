-- ============================================================================
-- CognitiveAdapt - Supabase schema (secure, row-level-security enabled)
-- Run once in: Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run: every statement is idempotent.
--
-- Accounts live in Supabase Auth (passwords are hashed by Supabase, never by
-- this app). Each auth user gets a row in public.profiles via a trigger.
-- ============================================================================

-- ---------- profiles --------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text        not null,
  email         text        not null,
  role          text        not null default 'student' check (role in ('student', 'admin')),
  student_id    text,
  institution   text,
  department    text,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);
create unique index if not exists profiles_email_key on public.profiles (lower(email));

-- ---------- study_sessions --------------------------------------------------
create table if not exists public.study_sessions (
  id                     text primary key,
  user_id                uuid        not null references public.profiles (id) on delete cascade,
  user_email             text        not null,
  user_name              text        not null,
  module_id              text        not null,
  module_title           text        not null,
  started_at             timestamptz not null default now(),
  completed_at           timestamptz,
  status                 text        not null check (status in ('in_progress', 'completed')),
  current_question_index integer     not null default 0,
  active_difficulty      text        not null,
  total_dwell_time_ms    bigint      not null default 0,
  responses              jsonb       not null default '[]'::jsonb,
  adaptation_history     jsonb       not null default '[]'::jsonb,
  final_metrics          jsonb
);
create index if not exists study_sessions_user_idx on public.study_sessions (user_id, started_at desc);

-- ---------- telemetry_events ------------------------------------------------
create table if not exists public.telemetry_events (
  id                      text primary key,
  user_id                 uuid        not null references public.profiles (id) on delete cascade,
  session_id              text        not null,
  module_id               text        not null,
  question_id             text,
  event_type              text        not null,
  details                 text,
  time_spent_ms           integer     not null default 0,
  cognitive_load_estimate numeric,
  "timestamp"             timestamptz not null default now()
);
create index if not exists telemetry_events_user_idx    on public.telemetry_events (user_id, "timestamp" desc);
create index if not exists telemetry_events_session_idx on public.telemetry_events (session_id);

-- ---------- helpers ---------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a profile for every new auth user. The role is ALWAYS 'student' here:
-- nobody can self-assign admin through sign-up metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, student_id, institution, department)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    nullif(trim(new.raw_user_meta_data ->> 'student_id'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'institution'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'department'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change a role (blocks privilege escalation via the API).
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for the SQL Editor / service role, which may bootstrap the first admin.
  -- Anyone calling through the API is an app user and must already be an admin.
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can change roles';
  end if;
  new.id    := old.id;
  new.email := old.email;
  return new;
end;
$$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Admin-only account removal (deletes the auth user; data cascades).
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can delete accounts';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;
  delete from auth.users where id = target;
end;
$$;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ---------- row level security ---------------------------------------------
alter table public.profiles         enable row level security;
alter table public.study_sessions   enable row level security;
alter table public.telemetry_events enable row level security;

-- Signed-out visitors may only learn that the tables exist (RLS returns 0 rows).
revoke insert, update, delete on public.profiles, public.study_sessions, public.telemetry_events from anon;

drop policy if exists "profiles: read own or admin"   on public.profiles;
drop policy if exists "profiles: update own or admin" on public.profiles;
drop policy if exists "profiles: admin delete"        on public.profiles;
create policy "profiles: read own or admin"   on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles: update own or admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy "profiles: admin delete"        on public.profiles for delete to authenticated
  using (public.is_admin());

drop policy if exists "sessions: read own or admin" on public.study_sessions;
drop policy if exists "sessions: insert own"        on public.study_sessions;
drop policy if exists "sessions: update own"        on public.study_sessions;
create policy "sessions: read own or admin" on public.study_sessions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "sessions: insert own"        on public.study_sessions for insert to authenticated
  with check (user_id = auth.uid());
create policy "sessions: update own"        on public.study_sessions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "events: read own or admin" on public.telemetry_events;
drop policy if exists "events: insert own"        on public.telemetry_events;
create policy "events: read own or admin" on public.telemetry_events for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "events: insert own"        on public.telemetry_events for insert to authenticated
  with check (user_id = auth.uid());

-- ---------- first administrator --------------------------------------------
-- 1) Register normally in the app.  2) Run this with YOUR email:
--
--   update public.profiles set role = 'admin' where lower(email) = lower('you@example.com');
--

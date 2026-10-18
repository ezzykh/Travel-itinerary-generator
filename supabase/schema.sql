-- Itinerary Builder: agency accounts and saved trips (Supabase / Postgres).
-- Run this once in the Supabase SQL editor of a new project.

create sequence if not exists public.agency_code_seq start 1001;

-- One row per agency account (created automatically when someone registers).
create table if not exists public.agencies (
  id uuid primary key references auth.users(id) on delete cascade,
  agency_code text unique not null default ('AG' || nextval('public.agency_code_seq')),
  name text,
  phone text,
  email text,
  profile jsonb not null default '{}'::jsonb,   -- branding, contact, bank, policies, custom templates
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key,
  agency_id uuid not null default auth.uid() references public.agencies(id) on delete cascade,
  title text,
  client text,
  start_date date,
  data jsonb not null,                            -- the whole trip, including flights from the PNR
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trips_agency_idx on public.trips (agency_id, updated_at desc);

-- Each agency can only see and change its own data.
alter table public.agencies enable row level security;
alter table public.trips enable row level security;

create policy "agency reads own row" on public.agencies
  for select to authenticated using ((select auth.uid()) = id);
create policy "agency updates own row" on public.agencies
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "agency manages own trips" on public.trips
  for all to authenticated using ((select auth.uid()) = agency_id) with check ((select auth.uid()) = agency_id);

-- Agencies may edit their details but not their agency code.
revoke all on public.agencies from anon, authenticated;
grant select on public.agencies to authenticated;
grant update (name, phone, profile, updated_at) on public.agencies to authenticated;
revoke all on public.trips from anon;
grant select, insert, update, delete on public.trips to authenticated;

-- Create the agency row when a user registers.
create or replace function public.handle_new_agency()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.agencies (id, name, phone, email)
  values (new.id, new.raw_user_meta_data->>'company', new.raw_user_meta_data->>'phone', new.email);
  return new;
end $$;
revoke execute on function public.handle_new_agency() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_agency on auth.users;
create trigger on_auth_user_created_agency after insert on auth.users
  for each row execute function public.handle_new_agency();

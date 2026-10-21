-- Decorique team access for the Order Log. Run once in Supabase > SQL Editor, after setup.sql.
-- Instead of one owner email, everyone on the team list can read, add, update and delete bookings,
-- and manage the team list itself. Each person signs in with their own email (one-time link).
-- Safe to run again.

create table if not exists public.team_members (
  email text primary key check (email = lower(email) and email like '%_@_%._%' and char_length(email) <= 120),
  added_at timestamptz not null default now(),
  added_by text
);

-- true when the signed-in person's email is on the team list
create or replace function public.is_team()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_members where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.is_team() from public;
grant execute on function public.is_team() to authenticated;

-- the team list: only the team can see it and change it, and nobody can remove themselves
-- (so the last person can never lock everyone out)
alter table public.team_members enable row level security;
drop policy if exists "team reads team" on public.team_members;
create policy "team reads team" on public.team_members for select to authenticated using (public.is_team());
drop policy if exists "team adds team" on public.team_members;
create policy "team adds team" on public.team_members for insert to authenticated with check (public.is_team());
drop policy if exists "team removes others" on public.team_members;
create policy "team removes others" on public.team_members for delete to authenticated
  using (public.is_team() and email <> lower(coalesce(auth.jwt() ->> 'email', '')));

-- bookings: the single-owner rules are replaced by team rules; the public can still only add new bookings
drop policy if exists "owner reads" on public.bookings;
drop policy if exists "owner updates" on public.bookings;
drop policy if exists "owner deletes" on public.bookings;
drop policy if exists "team reads" on public.bookings;
create policy "team reads" on public.bookings for select to authenticated using (public.is_team());
drop policy if exists "team adds" on public.bookings;
create policy "team adds" on public.bookings for insert to authenticated with check (public.is_team());
drop policy if exists "team updates" on public.bookings;
create policy "team updates" on public.bookings for update to authenticated using (public.is_team()) with check (public.is_team());
drop policy if exists "team deletes" on public.bookings;
create policy "team deletes" on public.bookings for delete to authenticated using (public.is_team());

-- the five team members; add or remove people later from the Team panel in the Order Log
insert into public.team_members (email, added_by) values ('kevinchacko2475@gmail.com', 'setup') on conflict do nothing;
insert into public.team_members (email, added_by) values ('sahana6405@gmail.com', 'setup') on conflict do nothing;
insert into public.team_members (email, added_by) values ('moulika0466@gmail.com', 'setup') on conflict do nothing;
insert into public.team_members (email, added_by) values ('shreedharanselvakumar@gmail.com', 'setup') on conflict do nothing;
insert into public.team_members (email, added_by) values ('swasthikkaranganathan@gmail.com', 'setup') on conflict do nothing;

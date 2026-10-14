-- Decorique bookings: public can only INSERT; only the owner email can read/update/delete.
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  birthday_person text check (char_length(birthday_person) <= 80),
  event_date date,
  slot text check (slot in ('Morning','Afternoon','Evening')),
  area text check (char_length(area) <= 80),
  package text check (char_length(package) <= 80),
  extras text check (char_length(extras) <= 200),
  notes text check (char_length(notes) <= 1000),
  est_total integer check (est_total between 0 and 100000),
  is_decor boolean not null default false,
  status text not null default 'new' check (status in ('new','confirmed','done','cancelled'))
);
alter table public.bookings enable row level security;
drop policy if exists "public can book" on public.bookings;
create policy "public can book" on public.bookings for insert to anon, authenticated
  with check (status = 'new');
drop policy if exists "owner reads" on public.bookings;
create policy "owner reads" on public.bookings for select to authenticated
  using ((auth.jwt() ->> 'email') = 'kevinchacko2475@gmail.com');
drop policy if exists "owner updates" on public.bookings;
create policy "owner updates" on public.bookings for update to authenticated
  using ((auth.jwt() ->> 'email') = 'kevinchacko2475@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'kevinchacko2475@gmail.com');
drop policy if exists "owner deletes" on public.bookings;
create policy "owner deletes" on public.bookings for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'kevinchacko2475@gmail.com');
-- Public availability: only date|slot of confirmed decor bookings, no personal data.
create or replace function public.booked_slots()
returns table(slot_key text) language sql security definer set search_path = public as $$
  select to_char(event_date,'YYYY-MM-DD') || '|' || slot from public.bookings
  where is_decor and status = 'confirmed' and event_date >= current_date and slot is not null;
$$;
revoke all on function public.booked_slots() from public;
grant execute on function public.booked_slots() to anon, authenticated;

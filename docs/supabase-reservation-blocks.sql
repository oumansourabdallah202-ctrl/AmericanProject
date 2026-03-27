-- Reservation blocks configured from admin
-- Use this to block a day, a time range, or a week/date range.
-- Run in Supabase SQL Editor.

create table if not exists public.reservation_blocks (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  start_time text,
  end_time text,
  reason text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reservation_blocks
  add constraint reservation_blocks_date_range_check check (start_date <= end_date);

alter table public.reservation_blocks enable row level security;
drop policy if exists "Service role only" on public.reservation_blocks;
create policy "Service role only"
  on public.reservation_blocks
  for all
  using (false)
  with check (false);

alter table public.trips
  add column if not exists start_address text,
  add column if not exists stop_address text;

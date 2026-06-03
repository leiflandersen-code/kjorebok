alter table public.profiles
  add column if not exists default_category text default 'Næring';

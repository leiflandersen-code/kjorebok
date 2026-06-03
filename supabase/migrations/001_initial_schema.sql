-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  default_vehicle_id uuid,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Vehicles
create table public.vehicles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  registration text not null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.vehicles enable row level security;

create policy "Authenticated users can view vehicles" on public.vehicles
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert vehicles" on public.vehicles
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update vehicles" on public.vehicles
  for update using (auth.role() = 'authenticated');

-- Customers
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  contact text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.customers enable row level security;

create policy "Authenticated users can view customers" on public.customers
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage customers" on public.customers
  for all using (auth.role() = 'authenticated');

-- Trips
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  start_time timestamptz not null,
  stop_time timestamptz,
  start_lat double precision,
  start_lng double precision,
  stop_lat double precision,
  stop_lng double precision,
  calculated_distance_km numeric(8,2),
  adjusted_distance_km numeric(8,2),
  category text not null default 'Næring',
  customer_id uuid references public.customers(id) on delete set null,
  customer_free_text text,
  purpose text,
  notes text,
  parking_cost numeric(8,2) default 0,
  toll_cost numeric(8,2) default 0,
  other_cost numeric(8,2) default 0,
  mileage_rate numeric(6,4) default 0.26,
  calculated_reimbursement numeric(10,2),
  status text not null default 'Utkast',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.trips enable row level security;

create policy "Authenticated users can view all trips" on public.trips
  for select using (auth.role() = 'authenticated');

create policy "Users can insert own trips" on public.trips
  for insert with check (auth.uid() = user_id);

create policy "Users can update own trips" on public.trips
  for update using (auth.uid() = user_id);

create policy "Users can delete own trips" on public.trips
  for delete using (auth.uid() = user_id);

-- Trip attachments
create table public.trip_attachments (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  url text not null,
  storage_path text not null,
  attachment_type text not null, -- parking, toll, receipt, other
  created_at timestamptz default now()
);

alter table public.trip_attachments enable row level security;

create policy "Authenticated users can view attachments" on public.trip_attachments
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage attachments" on public.trip_attachments
  for all using (auth.role() = 'authenticated');

-- Trip audit log
create table public.trip_audit_log (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  edited_by uuid references public.profiles(id) on delete set null not null,
  edited_at timestamptz default now() not null,
  field_changed text not null,
  old_value text,
  new_value text
);

alter table public.trip_audit_log enable row level security;

create policy "Authenticated users can view audit log" on public.trip_audit_log
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert audit log" on public.trip_audit_log
  for insert with check (auth.role() = 'authenticated');

-- Auto-update updated_at on trips
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trips_updated_at
  before update on public.trips
  for each row execute function update_updated_at();

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket for receipts
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);

create policy "Authenticated users can upload receipts" on storage.objects
  for insert with check (bucket_id = 'receipts' and auth.role() = 'authenticated');

create policy "Authenticated users can view receipts" on storage.objects
  for select using (bucket_id = 'receipts' and auth.role() = 'authenticated');

create policy "Authenticated users can delete receipts" on storage.objects
  for delete using (bucket_id = 'receipts' and auth.role() = 'authenticated');

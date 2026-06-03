-- ============================================================
-- 004_subscriptions.sql
-- Subscription status on profiles + promo codes system
-- ============================================================

-- Add subscription fields to profiles
alter table public.profiles
  add column if not exists subscription_status text default 'trial'
    check (subscription_status in ('trial', 'active', 'free', 'expired')),
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists trial_ends_at timestamptz default (now() + interval '14 days'),
  add column if not exists revenuecat_user_id text;

-- Promo codes table
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  max_uses int default null,       -- null = unlimited
  uses_count int default 0,
  valid_until timestamptz default null, -- null = never expires
  grants_status text default 'free' check (grants_status in ('free', 'active')),
  grants_months int default null,  -- null = permanent
  created_at timestamptz default now()
);

-- Track who used which code
create table if not exists public.promo_code_uses (
  id uuid primary key default gen_random_uuid(),
  code_id uuid references public.promo_codes(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  used_at timestamptz default now(),
  unique(code_id, user_id)
);

-- RLS
alter table public.promo_codes enable row level security;
alter table public.promo_code_uses enable row level security;

-- Anyone authenticated can read codes (to validate), but not list all
create policy "read promo codes for validation"
  on public.promo_codes for select
  to authenticated
  using (true);

-- Users can only see their own uses
create policy "users see own code uses"
  on public.promo_code_uses for select
  to authenticated
  using (user_id = auth.uid());

create policy "users insert own code uses"
  on public.promo_code_uses for insert
  to authenticated
  with check (user_id = auth.uid());

-- Function to redeem a promo code
create or replace function public.redeem_promo_code(p_code text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_code public.promo_codes;
  v_user_id uuid := auth.uid();
  v_already_used bool;
  v_expires_at timestamptz;
begin
  -- Find the code
  select * into v_code from public.promo_codes
    where lower(code) = lower(p_code);

  if not found then
    return jsonb_build_object('success', false, 'error', 'invalid_code');
  end if;

  -- Check expiry
  if v_code.valid_until is not null and v_code.valid_until < now() then
    return jsonb_build_object('success', false, 'error', 'code_expired');
  end if;

  -- Check max uses
  if v_code.max_uses is not null and v_code.uses_count >= v_code.max_uses then
    return jsonb_build_object('success', false, 'error', 'code_used_up');
  end if;

  -- Check if this user already used this code
  select exists(
    select 1 from public.promo_code_uses
    where code_id = v_code.id and user_id = v_user_id
  ) into v_already_used;

  if v_already_used then
    return jsonb_build_object('success', false, 'error', 'already_used');
  end if;

  -- Calculate expiry for non-permanent codes
  if v_code.grants_months is not null then
    v_expires_at := now() + (v_code.grants_months || ' months')::interval;
  else
    v_expires_at := null; -- permanent
  end if;

  -- Apply subscription
  update public.profiles
    set subscription_status = v_code.grants_status,
        subscription_expires_at = v_expires_at
    where id = v_user_id;

  -- Record usage
  insert into public.promo_code_uses (code_id, user_id)
    values (v_code.id, v_user_id);

  -- Increment counter
  update public.promo_codes
    set uses_count = uses_count + 1
    where id = v_code.id;

  return jsonb_build_object('success', true, 'status', v_code.grants_status, 'expires_at', v_expires_at);
end;
$$;

-- Insert some starter codes (change these!)
insert into public.promo_codes (code, description, max_uses)
  values
    ('KJOREBOK2025', 'Launch promo — unlimited free access', null),
    ('LEIF-FREE',    'Personal code for Leif',               1),
    ('KAMILA-FREE',  'Personal code for Kamila',             1)
  on conflict (code) do nothing;

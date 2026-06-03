-- ============================================================
-- 005_country_rates.sql
-- Per-bruker landvalg og sats
-- ============================================================

alter table public.profiles
  add column if not exists country_code text default 'ES',
  add column if not exists mileage_rate numeric(6,4) default 0.26,
  add column if not exists currency_code text default 'EUR',
  add column if not exists currency_symbol text default '€',
  add column if not exists country_selected_at timestamptz;  -- null = ikke valgt ennå (vis onboarding)

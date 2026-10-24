-- ---------------------------------------------------------------
-- PayPulse database schema (Supabase / PostgreSQL)
-- Run once in Supabase → SQL Editor → New query → Run.
--
-- Every row belongs to the signed-in user (user_id = auth.uid()).
-- Row Level Security makes sure a user can only ever read or
-- change their own transactions and alert reviews.
--
-- Never store card numbers, CVVs, UPI PINs or account passwords.
-- ---------------------------------------------------------------

create table if not exists public.transactions (
  user_id        uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id             text        not null,
  occurred_at    timestamptz not null,
  customer_id    text        not null,
  method         text        not null check (method in ('UPI', 'Card', 'Wallet', 'NetBanking')),
  amount         numeric(14, 2) not null check (amount > 0),
  status         text        not null check (status in ('Success', 'Failed', 'Pending')),
  merchant       text,
  category       text,
  city           text,
  device         text,
  failure_reason text,
  source         text        not null default 'Manual entry',
  created_at     timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists transactions_user_time_idx on public.transactions (user_id, occurred_at desc);

alter table public.transactions enable row level security;

drop policy if exists "transactions: read own"   on public.transactions;
drop policy if exists "transactions: insert own" on public.transactions;
drop policy if exists "transactions: update own" on public.transactions;
drop policy if exists "transactions: delete own" on public.transactions;

create policy "transactions: read own"   on public.transactions for select using (auth.uid() = user_id);
create policy "transactions: insert own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions: update own" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions: delete own" on public.transactions for delete using (auth.uid() = user_id);

-- Review status of monitoring alerts (alerts themselves are computed from transactions)
create table if not exists public.alert_reviews (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  alert_id   text        not null,
  status     text        not null check (status in ('Open', 'Under Review', 'Resolved')),
  updated_at timestamptz not null default now(),
  primary key (user_id, alert_id)
);

alter table public.alert_reviews enable row level security;

drop policy if exists "alert_reviews: all own" on public.alert_reviews;
create policy "alert_reviews: all own" on public.alert_reviews for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Data API access
-- Needed when "Automatically expose new tables" is turned OFF (recommended).
-- Only signed-in users get access; RLS above still limits them to their own rows.
-- Logged-out visitors (anon role) get nothing.
-- ---------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.transactions  to authenticated;
grant select, insert, update, delete on public.alert_reviews to authenticated;
revoke all on public.transactions  from anon;
revoke all on public.alert_reviews from anon;

alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists questions_used_today integer not null default 0,
  add column if not exists last_reset_date date not null default current_date,
  add column if not exists plan text not null default 'free',
  add column if not exists plan_status text not null default 'active',
  add column if not exists current_period_end timestamptz,
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists chat_questions_used_today integer not null default 0,
  add column if not exists mcq_generations_used_today integer not null default 0,
  add column if not exists usage_reset_date date not null default current_date;

update public.profiles
set
  plan = case when coalesce(is_premium, false) then 'pro' else coalesce(plan, 'free') end,
  plan_status = case when coalesce(is_premium, false) then 'active' else coalesce(plan_status, 'active') end,
  chat_questions_used_today = coalesce(chat_questions_used_today, questions_used_today, 0),
  usage_reset_date = coalesce(usage_reset_date, last_reset_date, current_date)
where true;

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  razorpay_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  razorpay_payment_id text unique,
  razorpay_subscription_id text,
  razorpay_invoice_id text,
  amount integer,
  currency text,
  status text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_razorpay_subscription_idx
  on public.profiles (razorpay_subscription_id);

create index if not exists billing_payments_user_created_idx
  on public.billing_payments (user_id, created_at desc);

alter table public.billing_events enable row level security;
alter table public.billing_payments enable row level security;

drop policy if exists "Service role owns billing events" on public.billing_events;
create policy "Service role owns billing events"
on public.billing_events for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Users can read own billing payments" on public.billing_payments;
create policy "Users can read own billing payments"
on public.billing_payments for select
using (auth.uid() = user_id);

drop policy if exists "Service role can manage billing payments" on public.billing_payments;
create policy "Service role can manage billing payments"
on public.billing_payments for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- LiqPay payment orders (server-side amount, tamper-resistant fulfillment)

create type payment_status as enum ('pending', 'success', 'failure', 'reversed');

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  amount_uah integer not null check (amount_uah > 0),
  currency text not null default 'UAH' check (currency = 'UAH'),
  status payment_status not null default 'pending',
  liqpay_payment_id bigint,
  liqpay_status text,
  liqpay_raw jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments (user_id, created_at desc);
create index if not exists payments_course_idx on public.payments (course_id);
create index if not exists payments_status_idx on public.payments (status) where status = 'pending';

create trigger payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy "payments_select_own_or_admin" on public.payments
  for select using (auth.uid() = user_id or public.is_admin());

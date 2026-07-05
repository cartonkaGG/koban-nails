-- Support threads (open/close) + Telegram message ID mapping

create table if not exists public.support_threads (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  closed_at timestamptz,
  closed_by text check (closed_by in ('user', 'admin')),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tg_links (
  telegram_message_id bigint primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists support_tg_links_user_idx
  on public.support_tg_links (user_id, created_at desc);

alter table public.support_threads enable row level security;
alter table public.support_tg_links enable row level security;

drop policy if exists "support_threads_select_own_or_admin" on public.support_threads;
create policy "support_threads_select_own_or_admin" on public.support_threads
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "support_threads_update_own_or_admin" on public.support_threads;
create policy "support_threads_update_own_or_admin" on public.support_threads
  for update using (auth.uid() = user_id or public.is_admin());

drop policy if exists "support_threads_insert_own_or_admin" on public.support_threads;
create policy "support_threads_insert_own_or_admin" on public.support_threads
  for insert with check (auth.uid() = user_id or public.is_admin());

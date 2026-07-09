-- Support chat: run ONCE in Supabase SQL Editor (idempotent).
-- Fixes: relation "support_threads" does not exist

-- 1) Messages (if missing)
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  direction text not null check (direction in ('user', 'admin')),
  telegram_message_id bigint,
  read_at timestamptz,
  guest_id uuid,
  created_at timestamptz not null default now()
);

alter table public.support_messages
  alter column user_id drop not null;

alter table public.support_messages
  add column if not exists guest_id uuid;

alter table public.support_messages
  add column if not exists read_at timestamptz;

alter table public.support_messages
  drop constraint if exists support_messages_actor_check;

alter table public.support_messages
  add constraint support_messages_actor_check
  check (
    (user_id is not null and guest_id is null)
    or (user_id is null and guest_id is not null)
  );

create index if not exists support_messages_user_idx
  on public.support_messages (user_id, created_at desc);

create index if not exists support_messages_guest_idx
  on public.support_messages (guest_id, created_at desc);

create index if not exists support_messages_unread_idx
  on public.support_messages (user_id, direction, read_at)
  where direction = 'admin' and read_at is null;

create index if not exists support_messages_tg_msg_idx
  on public.support_messages (telegram_message_id)
  where telegram_message_id is not null;

alter table public.support_messages enable row level security;

drop policy if exists "support_select_own_or_admin" on public.support_messages;
create policy "support_select_own_or_admin" on public.support_messages
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "support_insert_own" on public.support_messages;
create policy "support_insert_own" on public.support_messages
  for insert with check (auth.uid() = user_id and direction = 'user');

drop policy if exists "support_admin_insert" on public.support_messages;
create policy "support_admin_insert" on public.support_messages
  for insert with check (public.is_admin());

-- 2) Registered-user threads
create table if not exists public.support_threads (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  session_started_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by text check (closed_by in ('user', 'admin')),
  updated_at timestamptz not null default now()
);

alter table public.support_threads
  add column if not exists session_started_at timestamptz not null default now();

alter table public.support_threads enable row level security;

drop policy if exists "support_threads_select_own_or_admin" on public.support_threads;
create policy "support_threads_select_own_or_admin" on public.support_threads
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "support_threads_update_own_or_admin" on public.support_threads;
create policy "support_threads_update_own_or_admin" on public.support_threads
  for update using (auth.uid() = user_id or public.is_admin());

drop policy if exists "support_threads_insert_own_or_admin" on public.support_threads;
create policy "support_threads_insert_own_or_admin" on public.support_threads
  for insert with check (auth.uid() = user_id or public.is_admin());

-- 3) Guest threads (no registration)
create table if not exists public.support_guest_threads (
  guest_id uuid primary key,
  guest_name text,
  status text not null default 'open' check (status in ('open', 'closed')),
  session_started_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by text check (closed_by in ('user', 'admin')),
  updated_at timestamptz not null default now()
);

-- 4) Telegram reply links
create table if not exists public.support_tg_links (
  telegram_message_id bigint primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  guest_id uuid,
  created_at timestamptz not null default now()
);

alter table public.support_tg_links
  alter column user_id drop not null;

alter table public.support_tg_links
  add column if not exists guest_id uuid;

create index if not exists support_tg_links_user_idx
  on public.support_tg_links (user_id, created_at desc);

create index if not exists support_tg_links_guest_idx
  on public.support_tg_links (guest_id, created_at desc);

alter table public.support_tg_links enable row level security;

-- 5) Fix open threads: show full message history (not hidden by session filter)
update public.support_threads
set session_started_at = '1970-01-01T00:00:00.000Z'::timestamptz
where status = 'open'
  and session_started_at > '1970-01-02T00:00:00.000Z'::timestamptz;

update public.support_guest_threads
set session_started_at = '1970-01-01T00:00:00.000Z'::timestamptz
where status = 'open'
  and session_started_at > '1970-01-02T00:00:00.000Z'::timestamptz;

-- Guest support (no registration required)

alter table public.support_messages
  alter column user_id drop not null;

alter table public.support_messages
  add column if not exists guest_id uuid;

alter table public.support_messages
  drop constraint if exists support_messages_actor_check;

alter table public.support_messages
  add constraint support_messages_actor_check
  check (
    (user_id is not null and guest_id is null)
    or (user_id is null and guest_id is not null)
  );

create index if not exists support_messages_guest_idx
  on public.support_messages (guest_id, created_at desc);

create table if not exists public.support_guest_threads (
  guest_id uuid primary key,
  guest_name text,
  status text not null default 'open' check (status in ('open', 'closed')),
  session_started_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by text check (closed_by in ('user', 'admin')),
  updated_at timestamptz not null default now()
);

alter table public.support_tg_links
  alter column user_id drop not null;

alter table public.support_tg_links
  add column if not exists guest_id uuid;

create index if not exists support_tg_links_guest_idx
  on public.support_tg_links (guest_id, created_at desc);

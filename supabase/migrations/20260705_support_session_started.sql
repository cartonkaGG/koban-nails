-- Deprecated: use 20260705_support_threads.sql (includes session_started_at)
-- Kept for reference only; safe no-op if tables already exist.

alter table public.support_threads
  add column if not exists session_started_at timestamptz not null default now();

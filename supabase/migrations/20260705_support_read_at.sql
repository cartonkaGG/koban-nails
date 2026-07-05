-- Unread support replies badge
alter table public.support_messages
  add column if not exists read_at timestamptz;

create index if not exists support_messages_unread_idx
  on public.support_messages (user_id, direction, read_at)
  where direction = 'admin' and read_at is null;

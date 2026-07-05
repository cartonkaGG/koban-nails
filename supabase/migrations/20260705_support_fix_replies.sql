-- Fix support_messages: allow server (service role) to insert admin replies via webhook

drop policy if exists "support_admin_insert" on public.support_messages;
create policy "support_admin_insert" on public.support_messages
  for insert with check (public.is_admin());

-- Ensure open threads show full message history (not hidden by session filter)
update public.support_threads
set session_started_at = '1970-01-01'::timestamptz
where status = 'open';

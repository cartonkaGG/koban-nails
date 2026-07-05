-- Course video storage + support chat messages
-- Run in Supabase SQL editor after main schema

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-videos',
  'course-videos',
  false,
  524288000,
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "course_videos_admin_all" on storage.objects;
create policy "course_videos_admin_all"
on storage.objects for all
using (bucket_id = 'course-videos' and public.is_admin())
with check (bucket_id = 'course-videos' and public.is_admin());

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  direction text not null check (direction in ('user', 'admin')),
  telegram_message_id bigint,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_user_idx
  on public.support_messages (user_id, created_at desc);

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

drop policy if exists "enrollments_admin_update" on public.enrollments;
drop policy if exists "enrollments_admin_all" on public.enrollments;
create policy "enrollments_admin_all" on public.enrollments
  for all using (public.is_admin()) with check (public.is_admin());

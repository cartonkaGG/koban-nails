-- Run once in Supabase SQL Editor if save/upload fails (idempotent)

alter table public.courses
  add column if not exists sale_price_uah integer;

alter table public.courses
  add column if not exists archived_at timestamptz;

alter table public.courses
  add column if not exists certificate_template_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-images',
  'course-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "course_images_admin_all" on storage.objects;
create policy "course_images_admin_all"
on storage.objects for all
using (bucket_id = 'course-images' and public.is_admin())
with check (bucket_id = 'course-images' and public.is_admin());

drop policy if exists "course_images_public_read" on storage.objects;
create policy "course_images_public_read"
on storage.objects for select
using (bucket_id = 'course-images');

drop policy if exists "courses_select_published" on public.courses;
create policy "courses_select_published" on public.courses
  for select using (
    public.is_admin()
    or (published = true and archived_at is null)
    or exists (
      select 1 from public.enrollments e
      where e.course_id = courses.id
        and e.user_id = auth.uid()
    )
  );

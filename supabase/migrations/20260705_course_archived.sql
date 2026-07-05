-- Soft-archive courses: hide from site but keep enrollments and lesson access

alter table public.courses
  add column if not exists archived_at timestamptz;

comment on column public.courses.archived_at is 'When set, course is hidden from the storefront; enrollments are preserved.';

create index if not exists courses_archived_idx on public.courses (archived_at);

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

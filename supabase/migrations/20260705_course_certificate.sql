-- Certificate template for PDF generation after course completion

alter table public.courses
  add column if not exists certificate_template_url text;

comment on column public.courses.certificate_template_url is
  'Blank certificate image (storage: path or https URL). Overlaid with student name and completion date.';

-- Allow students to mark their own enrollment completed after finishing all lessons
drop policy if exists "enrollments_complete_own" on public.enrollments;
create policy "enrollments_complete_own" on public.enrollments
  for update
  using (auth.uid() = user_id and status = 'active')
  with check (auth.uid() = user_id and status = 'completed');

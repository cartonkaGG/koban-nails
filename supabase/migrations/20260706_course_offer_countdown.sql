-- Optional per-course urgency countdown (off by default; enable in admin)
alter table public.courses
  add column if not exists offer_countdown_enabled boolean not null default false;

comment on column public.courses.offer_countdown_enabled is 'When true, show 3h personal offer countdown on course cards and sticky CTA';

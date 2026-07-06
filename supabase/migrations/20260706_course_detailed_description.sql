alter table public.courses
  add column if not exists detailed_description text;

comment on column public.courses.detailed_description is
  'Повний опис курсу для сторінки /courses/[slug]; короткий description лишається на картці.';

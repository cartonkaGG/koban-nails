alter table public.enrollments
  add column if not exists completed_at timestamptz;

-- Backfill from the latest lesson completion timestamp per enrollment.
update public.enrollments e
set completed_at = sub.max_completed
from (
  select
    lp.user_id,
    l.course_id,
    max(lp.completed_at) as max_completed
  from public.lesson_progress lp
  inner join public.lessons l on l.id = lp.lesson_id
  where lp.completed = true
    and lp.completed_at is not null
  group by lp.user_id, l.course_id
) sub
where e.user_id = sub.user_id
  and e.course_id = sub.course_id
  and e.completed_at is null
  and e.status = 'completed';

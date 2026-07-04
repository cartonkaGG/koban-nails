-- Harden existing Supabase projects for Koban nails.
-- Run this in Supabase SQL Editor if the database was created before the
-- hardened RLS rules were added to supabase/schema.sql.

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only admins can change profile roles';
    end if;

    if new.email is distinct from old.email then
      raise exception 'Only admins can change profile emails';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "lessons_select_enrolled_or_admin" on public.lessons;
create policy "lessons_select_enrolled_or_admin" on public.lessons
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.course_id = lessons.course_id
        and e.user_id = auth.uid()
        and e.status in ('active', 'completed')
    )
  );

drop policy if exists "enrollments_insert_own" on public.enrollments;
create policy "enrollments_insert_own" on public.enrollments
  for insert with check (
    auth.uid() = user_id
    and status = 'pending'
    and purchased_at is null
  );

drop policy if exists "enrollments_admin_update" on public.enrollments;
create policy "enrollments_admin_update" on public.enrollments
  for update using (public.is_admin()) with check (public.is_admin());

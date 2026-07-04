-- Koban Nails LMS schema

create extension if not exists "pgcrypto";

create type course_format as enum ('online', 'offline');
create type enrollment_status as enum ('pending', 'active', 'completed', 'cancelled');
create type user_role as enum ('student', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  role user_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  format course_format not null default 'online',
  price_uah integer not null default 0,
  image_url text,
  badge text,
  featured boolean not null default false,
  published boolean not null default true,
  features jsonb not null default '[]'::jsonb,
  payment_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  summary text not null default '',
  content text not null default '',
  video_url text,
  duration_min integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status enrollment_status not null default 'pending',
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, lesson_id)
);

create index if not exists courses_published_idx on public.courses (published, sort_order);
create index if not exists lessons_course_idx on public.lessons (course_id, sort_order);
create index if not exists enrollments_user_idx on public.enrollments (user_id, status);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text := current_setting('app.admin_email', true);
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when admin_email is not null and lower(new.email) = lower(admin_email) then 'admin'::user_role
      else 'student'::user_role
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger profiles_prevent_privilege_escalation before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();
create trigger courses_updated_at before update on public.courses
for each row execute function public.set_updated_at();
create trigger lessons_updated_at before update on public.lessons
for each row execute function public.set_updated_at();

-- Profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Courses: public read published, admin full
create policy "courses_select_published" on public.courses
  for select using (published = true or public.is_admin());
create policy "courses_admin_insert" on public.courses
  for insert with check (public.is_admin());
create policy "courses_admin_update" on public.courses
  for update using (public.is_admin());
create policy "courses_admin_delete" on public.courses
  for delete using (public.is_admin());

-- Lessons: enrolled users + admin
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
create policy "lessons_admin_write" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

-- Enrollments
create policy "enrollments_select_own_or_admin" on public.enrollments
  for select using (auth.uid() = user_id or public.is_admin());
create policy "enrollments_insert_own" on public.enrollments
  for insert with check (
    auth.uid() = user_id
    and status = 'pending'
    and purchased_at is null
  );
create policy "enrollments_admin_update" on public.enrollments
  for update using (public.is_admin()) with check (public.is_admin());

-- Lesson progress
create policy "progress_select_own_or_admin" on public.lesson_progress
  for select using (auth.uid() = user_id or public.is_admin());
create policy "progress_upsert_own" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed courses
insert into public.courses (slug, title, description, format, price_uah, image_url, badge, featured, features, sort_order)
values
  (
    'basic',
    'Basic',
    'Старт з нуля у студії з практикою на моделях.',
    'offline',
    12900,
    '/course-basic.png',
    'офлайн',
    false,
    '["Комбінований манікюр","Вирівнювання та покриття","Стерилізація та робоче місце","Сертифікат після практики"]'::jsonb,
    1
  ),
  (
    'online',
    'Online',
    'Навчання у власному темпі з перевіркою робіт.',
    'online',
    7900,
    '/course-online.png',
    'онлайн',
    true,
    '["Відеоуроки на 6 місяців","Домашні завдання","Коментарі куратора","Фінальна робота"]'::jsonb,
    2
  ),
  (
    'pro',
    'Pro',
    'Для майстрів, які хочуть працювати швидше і чистіше.',
    'offline',
    9500,
    '/course-pro.png',
    'підвищення',
    false,
    '["Корекція техніки","Тонке покриття","Швидкий френч","Розбір ваших робіт"]'::jsonb,
    3
  )
on conflict (slug) do nothing;

-- Seed online lessons
insert into public.lessons (course_id, title, summary, content, video_url, duration_min, sort_order)
select c.id, l.title, l.summary, l.content, l.video_url, l.duration_min, l.sort_order
from public.courses c
cross join (
  values
    (1, 'Вступ до курсу', 'Організація навчання та матеріали', 'У цьому уроці ви дізнаєтесь, як проходить онлайн-навчання, які матеріали потрібні та як надсилати домашні завдання на перевірку.', '', 8),
    (2, 'Підготовка та стерилізація', 'Безпека та робоче місце', 'Розбираємо стерилізацію інструментів, дезінфекцію поверхонь і правильну організацію робочого місця майстра.', '', 14),
    (3, 'Комбінований манікюр', 'Техніка зрізу та обробки', 'Покроковий алгоритм комбінованого манікюру: підготовка, зріз, полірування та безпечна робота з кутикулою.', '', 22),
    (4, 'Покриття та вирівнювання', 'Рівна база без подтеків', 'Вчимося наносити базу та гель-лак рівно, контролювати товщину та уникати подтеків біля кутикули.', '', 18),
    (5, 'Фінальна робота', 'Здача проєкту', 'Зніміть фінальну роботу за чеклістом і надішліть на перевірку. Після оцінювання отримаєте сертифікат.', '', 12)
) as l(sort_order, title, summary, content, video_url, duration_min)
where c.slug = 'online'
  and not exists (select 1 from public.lessons where course_id = c.id);

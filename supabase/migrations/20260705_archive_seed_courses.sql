-- Hide default seed courses (Online, Pro, Basic) from storefront

update public.courses
set
  archived_at = coalesce(archived_at, now()),
  published = false,
  featured = false
where slug in ('online', 'pro', 'basic');

# Supabase для Koban nails

## 1. Створити проєкт

1. Відкрийте https://supabase.com
2. Створіть новий Project.
3. У Supabase відкрийте SQL Editor.
4. Скопіюйте весь файл `supabase/schema.sql` і натисніть Run.

Якщо база вже була створена раніше, не запускайте весь `schema.sql` повторно.
Для оновлення правил безпеки запустіть файл:

```txt
supabase/migrations/20260704_harden_rls.sql
```

## 2. Додати ключі локально

Створіть файл `.env.local` у корені проєкту:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Беріть ці значення в Supabase: Project Settings -> API.

Важливо: вставляйте тільки `anon public` key. Не вставляйте `service_role` key у цей сайт.

## 3. Налаштувати вхід по email

У Supabase відкрийте Authentication -> URL Configuration:

```txt
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/auth/callback
```

Для Vercel додайте ще:

```txt
Site URL: https://koban-nails.vercel.app
Redirect URL: https://koban-nails.vercel.app/auth/callback
```

## 4. Додати ключі у Vercel

У Vercel відкрийте Project -> Settings -> Environment Variables і додайте:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

Після цього зробіть Redeploy.

## 5. Зробити першого адміна

Спочатку увійдіть на сайт через свій email, щоб Supabase створив профіль.

Потім у Supabase SQL Editor виконайте:

```sql
update public.profiles
set role = 'admin'
where email = 'your@email.com';
```

Після цього `/admin` відкриється для цього email.

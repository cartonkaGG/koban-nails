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
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=your@email.com
```

Беріть ці значення в Supabase: Project Settings -> API.

Важливо: для `NEXT_PUBLIC_SUPABASE_ANON_KEY` вставляйте тільки `anon public` key.
`service_role` key можна додавати тільки в `SUPABASE_SERVICE_ROLE_KEY` як server-only env без `NEXT_PUBLIC_`.
У Vercel позначте його як Sensitive.

## 3. Налаштувати вхід по email і паролю

У Supabase відкрийте Authentication -> Providers -> Email і перевірте, що Email provider увімкнений.

Потім відкрийте Authentication -> URL Configuration:

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
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS
```

Після цього зробіть Redeploy.

## 5. Як залогінитися

1. Відкрийте `/login`.
2. Якщо акаунта ще немає, відкрийте вкладку `Реєстрація`.
3. Введіть email і пароль.
4. Якщо Supabase просить підтвердити email, відкрийте лист і підтвердіть пошту.
5. Поверніться на `/login` і увійдіть з email та паролем.

Якщо email є в `ADMIN_EMAILS`, сайт покаже доступ до `/admin`.

## 6. Зробити першого адміна через SQL

Спочатку увійдіть на сайт через свій email, щоб Supabase створив профіль.

Потім у Supabase SQL Editor виконайте:

```sql
update public.profiles
set role = 'admin'
where email = 'your@email.com';
```

Після цього `/admin` відкриється для цього email.

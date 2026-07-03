# Koban Nails — LMS платформа

Сайт курсів манікюру з:
- лендингом і динамічним каталогом курсів
- входом по email (magic link через Supabase)
- кабінетом учня з переглядом онлайн-уроків
- адмін-панеллю для курсів, уроків і доступів

## Швидкий старт (демо без Supabase)

```bash
npm install
npm run dev
```

Відкрийте `http://localhost:3000`

- **Увійти як учень:** будь-який email без слова `admin` → `/cabinet`
- **Увійти як адмін:** email з `admin` (наприклад `admin@test.com`) → `/admin`

## Продакшен з Supabase

1. Створіть проєкт на [supabase.com](https://supabase.com)
2. У SQL Editor виконайте `supabase/schema.sql`
3. У Authentication → URL Configuration додайте:
   - Site URL: `https://ваш-домен.vercel.app`
   - Redirect: `https://ваш-домен.vercel.app/auth/callback`
4. Скопіюйте `.env.example` → `.env.local` і заповніть ключі
5. Перший адмін: зареєструйтесь email-ом, потім у таблиці `profiles` встановіть `role = 'admin'`

Або в Supabase SQL:

```sql
alter database postgres set app.admin_email = 'your@email.com';
```

(для нових реєстрацій через тригер)

## Маршрути

| URL | Опис |
|-----|------|
| `/` | Лендинг |
| `/login` | Вхід по email |
| `/checkout/[slug]` | Покупка курсу |
| `/cabinet` | Курси учня |
| `/cabinet/courses/[slug]` | Перегляд онлайн-уроків |
| `/cabinet/profile` | Профіль |
| `/admin` | Дашборд |
| `/admin/courses` | Список курсів |
| `/admin/courses/[id]` | Редагування + уроки |
| `/admin/users` | Учні та статуси оплати |

## Деплой на Vercel

1. Підключіть репозиторій
2. Додайте env змінні Supabase
3. Framework Preset: **Next.js**

Старий статичний `index.html` збережено в корені як архів; основний сайт тепер Next.js.

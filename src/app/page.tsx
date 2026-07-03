import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CourseGrid } from "@/components/course-grid";
import { IconArrowRight } from "@/components/icons";
import { getPublishedCourses } from "@/lib/data";

export default async function HomePage() {
  const courses = await getPublishedCourses();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative isolate flex min-h-[92svh] items-center overflow-hidden py-28 sm:py-32">
          <Image
            src="/manicure-hero.png"
            alt="Koban nails"
            fill
            priority
            className="-z-20 object-cover object-[68%_center] opacity-80"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,8,6,.98)_0%,rgba(7,8,6,.88)_42%,rgba(7,8,6,.42)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-black to-transparent" />

          <div className="shell">
            <div className="max-w-2xl">
              <p className="eyebrow">курси манікюру онлайн та офлайн</p>
              <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-5xl leading-[.92] sm:text-7xl lg:text-8xl">
                Koban <em className="text-gold">nails</em>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-body sm:text-lg">
                Від нуля до першого клієнта за 4 тижні. Онлайн-уроки, офлайн практика,
                сертифікат і доступ до кабінету з матеріалами після покупки курсу.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="#courses" className="btn btn-primary">
                  Обрати курс
                  <IconArrowRight />
                </Link>
                <Link href="/login" className="btn btn-ghost">Увійти в кабінет</Link>
              </div>
            </div>
          </div>
        </section>

        <CourseGrid courses={courses} />

        <section id="format" className="border-y border-line/60 py-16">
          <div className="shell grid gap-8 lg:grid-cols-2">
            <div className="card overflow-hidden">
              <div className="eyebrow">навчання</div>
              <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl">
                Від першого руху до готової роботи
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-cream-body">
                Теорія, практика і зворотний зв&apos;язок. Онлайн-уроки доступні 24/7
                у вашому кабінеті після оплати, а офлайн формати проходять з практикою
                на моделях.
              </p>
              <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-xl border border-line">
                <Image src="/about-training.png" alt="Навчання Koban nails" fill className="object-cover" />
              </div>
            </div>

            <div className="grid gap-4">
              {[
                ["Теорія без зайвого", "Матеріали, інструменти, стерилізація та послідовність процедури простими словами."],
                ["Відпрацювання техніки", "Чистий зріз, рівне покриття, безпечна робота і контроль помилок."],
                ["Готовність до клієнтів", "Алгоритм роботи, перші фото для портфоліо і впевненість у своїх діях."],
              ].map(([title, text], i) => (
                <article key={title} className="card flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-sm font-bold text-gold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-cream-body">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-16">
          <div className="shell max-w-3xl">
            <div className="eyebrow">faq</div>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl">
              Питання перед купівлею
            </h2>
            <div className="mt-8 space-y-3">
              {[
                ["Як отримати доступ після оплати?", "Увійдіть на email, який вказали при покупці. Онлайн-курс з'явиться в кабінеті після підтвердження оплати."],
                ["Чи можна проходити уроки у своєму темпі?", "Так. Уроки відкриті 24/7, прогрес зберігається у вашому профілі."],
                ["Що якщо я купила офлайн-курс?", "У кабінеті буде інформація про запис, дату та матеріали для підготовки."],
              ].map(([q, a]) => (
                <details key={q} className="card">
                  <summary className="cursor-pointer list-none font-medium">{q}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-cream-body">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/60 py-8">
        <div className="shell flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Koban nails © {new Date().getFullYear()}</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-gold">Увійти</Link>
            <Link href="/cabinet" className="hover:text-gold">Кабінет</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

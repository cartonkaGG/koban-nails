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
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="shell grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="eyebrow">курси манікюру онлайн та офлайн</p>
              <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl leading-tight sm:text-6xl">
                Koban <em className="text-gold not-italic">nails</em>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-cream-body sm:text-lg">
                Від нуля до першого клієнта за 4 тижні. Після покупки онлайн-курсу — доступ у кабінеті з уроками, прогресом і матеріалами.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#courses" className="btn btn-primary">
                  Обрати курс
                  <IconArrowRight />
                </Link>
                <Link href="/login" className="btn btn-ghost">Увійти в кабінет</Link>
              </div>
            </div>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-line">
              <Image src="/manicure-hero.png" alt="Koban nails" fill className="object-cover" priority />
            </div>
          </div>
        </section>

        <CourseGrid courses={courses} />

        <section id="format" className="border-y border-line/60 py-16">
          <div className="shell grid gap-8 lg:grid-cols-2">
            <div className="card">
              <div className="eyebrow">навчання</div>
              <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl">Від першого руху до готової роботи</h2>
              <p className="mt-4 text-sm leading-relaxed text-cream-body">
                Теорія, практика і зворотний зв&apos;язок. Онлайн-уроки доступні 24/7 у вашому кабінеті після оплати.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                ["Теорія без зайвого", "Матеріали, інструменти, стерилізація простими словами."],
                ["Відпрацювання техніки", "Чистий зріз, рівне покриття, безпечна робота."],
                ["Готовність до клієнтів", "Алгоритм роботи, портфоліо і впевненість у діях."],
              ].map(([title, text], i) => (
                <article key={title} className="card flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-sm font-bold text-gold">{i + 1}</span>
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-1 text-sm text-cream-body">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-16">
          <div className="shell max-w-3xl">
            <div className="eyebrow">faq</div>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl">Питання перед купівлею</h2>
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

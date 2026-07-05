import Link from "next/link";
import { LandingHero } from "@/components/landing/hero";
import { LandingTopbar } from "@/components/landing/topbar";
import { CourseGrid } from "@/components/course-grid";
import { FooterAuthLink } from "@/components/auth/site-auth-button";
import { getPublishedCourses } from "@/lib/data";
import { DEMO_COURSES } from "@/lib/demo-data";

export const revalidate = 120;

export default async function HomePage() {
  const courses = await getPublishedCourses().catch(() => DEMO_COURSES);

  return (
    <>
      <LandingTopbar />
      <main id="top">
        <LandingHero />
        <CourseGrid courses={courses} />

        <section id="format" className="border-y border-line/60 py-16">
          <div className="shell grid gap-8 lg:grid-cols-2">
            <div className="card">
              <div className="eyebrow">навчання</div>
              <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl">
                Від першого руху до готової роботи
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-cream-body">
                Теорія, практика і зворотний зв&apos;язок. Онлайн-уроки доступні 24/7 у кабінеті після оплати.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                ["Теорія без зайвого", "Матеріали, інструменти, стерилізація простими словами."],
                ["Відпрацювання техніки", "Чистий зріз, рівне покриття, безпечна робота."],
                ["Готовність до клієнтів", "Алгоритм роботи, портфоліо і впевненість у діях."],
              ].map(([title, text], i) => (
                <article key={title} className="card flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-sm font-bold text-gold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-1 text-sm text-cream-body">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="reviews" className="py-16">
          <div className="shell">
            <div className="eyebrow">відгуки</div>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl">Після курсу</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                "Після Online я нарешті зрозуміла послідовність і перестала боятися перших клієнтів.",
                "Онлайн-формат зручний: дивлюсь уроки ввечері, а куратор коментує мої роботи.",
                "Pro допоміг прибрати зайві рухи — стала швидше і чистіше працювати.",
              ].map((text) => (
                <article key={text} className="card text-sm leading-relaxed text-cream-body">
                  {text}
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
                ["Як отримати доступ після оплати?", "Увійдіть на email після покупки. Онлайн-курс з'явиться в кабінеті після підтвердження оплати."],
                ["Чи можна проходити уроки у своєму темпі?", "Так. Уроки відкриті 24/7, прогрес зберігається у профілі."],
                ["Чи є підтримка під час навчання?", "Так. Куратор перевіряє домашні роботи та відповідає на питання у кабінеті."],
              ].map(([q, a]) => (
                <details key={q} className="card">
                  <summary className="cursor-pointer list-none font-medium">{q}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-cream-body">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="shell">
            <div className="card text-center">
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl">
                Почніть заробляти на манікюрі одразу після проходження курсу
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-cream-body">
                Оберіть курс і оплатіть онлайн — доступ до матеріалів відкриється в кабінеті.
              </p>
              <Link href="/#courses" className="landing-btn landing-btn-sell mt-6 inline-flex">
                Обрати курс
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/60 py-8">
        <div className="shell flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Галина Кобан © {new Date().getFullYear()}</p>
          <div className="flex flex-wrap gap-4">
            <FooterAuthLink />
            <Link href="/cabinet" className="hover:text-gold">Кабінет</Link>
            <Link href="/terms" className="hover:text-gold">Умови використання</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

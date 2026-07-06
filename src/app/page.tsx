import Link from "next/link";
import { LandingHero } from "@/components/landing/hero";
import { LandingTopbar } from "@/components/landing/topbar";
import { CourseGrid } from "@/components/course-grid";
import { StudentGallery } from "@/components/landing/student-gallery";
import { LandingFormatSection } from "@/components/landing/format-section";
import { LandingReviewsSection } from "@/components/landing/reviews-section";
import { SiteFooter } from "@/components/site-footer";
import { getPublishedCourses } from "@/lib/data";

export const revalidate = 60;

export default async function HomePage() {
  const courses = await getPublishedCourses();

  return (
    <>
      <LandingTopbar />
      <main id="top">
        <LandingHero />
        <CourseGrid courses={courses} />
        <StudentGallery />

        <LandingFormatSection />
        <LandingReviewsSection />

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

      <SiteFooter />
    </>
  );
}

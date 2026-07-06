import Link from "next/link";
import { LandingTopbar } from "@/components/landing/topbar";
import { SiteFooter } from "@/components/site-footer";
import { businessInfo } from "@/content/business";
import { getPublishedCourses, getLessonsForCourse } from "@/lib/data";
import { formatPrice } from "@/lib/types";

export const metadata = {
  title: "Освітні послуги | Koban Nails",
  description: "Опис освітніх програм, формату навчання, тривалості та сертифікатів Koban Nails.",
};

export const revalidate = 60;

function formatLabel(format: string) {
  return format === "offline" ? "Офлайн" : "Онлайн";
}

export default async function ServicesPage() {
  const courses = await getPublishedCourses();

  const cards = await Promise.all(
    courses.map(async (course) => {
      const lessons = await getLessonsForCourse(course.id);
      const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.duration_min, 0);
      const hours = Math.max(1, Math.round(totalMinutes / 60));

      return {
        course,
        lessonsCount: lessons.length,
        durationLabel:
          course.format === "online"
            ? lessons.length > 0
              ? `≈ ${hours} год відео · у власному темпі`
              : "У власному темпі"
            : "За розкладом Виконавця",
        certificate: Boolean(course.certificate_template_url),
      };
    }),
  );

  return (
    <>
      <LandingTopbar />
      <main className="shell py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-sm text-muted hover:text-gold">
            ← На головну
          </Link>

          <div className="mt-6 space-y-8">
            <div>
              <p className="eyebrow">документи</p>
              <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
                Опис освітніх послуг
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-cream-body">
                {businessInfo.legalName} надає освітні послуги з манікюру та педикюру під брендом{" "}
                {businessInfo.brandName}. Нижче — актуальний перелік програм, формат навчання та
                умови видачі сертифікатів.
              </p>
            </div>

            {cards.length === 0 ? (
              <section className="card text-sm text-cream-body">
                Наразі немає опублікованих курсів. Актуальний перелік з&apos;явиться на головній
                сторінці сайту.
              </section>
            ) : (
              <div className="space-y-4">
                {cards.map(({ course, lessonsCount, durationLabel, certificate }) => (
                  <article key={course.id} className="card space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-cream">
                          {course.title}
                        </h2>
                        <p className="mt-1 text-sm text-muted">{formatLabel(course.format)}</p>
                      </div>
                      <p className="text-lg font-medium text-gold">{formatPrice(course.price_uah)}</p>
                    </div>

                    <p className="text-sm leading-relaxed text-cream-body">{course.description}</p>

                    <dl className="services-meta">
                      <div>
                        <dt>Формат</dt>
                        <dd>{formatLabel(course.format)}</dd>
                      </div>
                      <div>
                        <dt>Тривалість</dt>
                        <dd>{durationLabel}</dd>
                      </div>
                      <div>
                        <dt>Уроків</dt>
                        <dd>{lessonsCount > 0 ? lessonsCount : "Уточнюється"}</dd>
                      </div>
                      <div>
                        <dt>Сертифікат</dt>
                        <dd>{certificate ? "Так, після 100% проходження" : "Не передбачено"}</dd>
                      </div>
                    </dl>

                    {course.features.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-cream">Що входить у навчання</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-cream-body">
                          {course.features.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {course.format === "online" && (
                      <p className="text-xs text-muted">
                        Після оплати курс відкривається в особистому кабінеті з відеоуроками та
                        відстеженням прогресу.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            <section className="card space-y-3 text-sm leading-relaxed text-cream-body">
              <h2 className="font-medium text-cream">Загальні умови</h2>
              <p>
                Детальні правила надання послуг, оплати та повернення коштів визначені в{" "}
                <Link href="/offer" className="text-gold hover:underline">
                  Публічній оферті
                </Link>
                ,{" "}
                <Link href="/privacy" className="text-gold hover:underline">
                  Політиці конфіденційності
                </Link>{" "}
                та{" "}
                <Link href="/refund" className="text-gold hover:underline">
                  Політиці повернення коштів
                </Link>
                .
              </p>
            </section>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/offer" className="text-gold hover:underline">
                Публічна оферта
              </Link>
              <Link href="/privacy" className="text-gold hover:underline">
                Політика конфіденційності
              </Link>
              <Link href="/refund" className="text-gold hover:underline">
                Політика повернення коштів
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

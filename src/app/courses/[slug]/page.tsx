import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseBuyButton } from "@/components/course-buy-button";
import { CourseDetailedDescription } from "@/components/course-detailed-description";
import { CoursePrice } from "@/components/course-price";
import { IconCheck } from "@/components/icons";
import { LandingTopbar } from "@/components/landing/topbar";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import {
  formatCourseFormat,
  getCourseDurationLabel,
  hasCourseCertificate,
} from "@/lib/course-details";
import { getCourseBySlug, getLessonsForCourse } from "@/lib/data";
import { resolveCourseImageUrl } from "@/lib/images";
import { buildCourseSchema, courseMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course?.published) {
    return { title: "Курс не знайдено" };
  }

  const imageUrl = resolveCourseImageUrl(course.image_url);
  return courseMetadata(course, imageUrl ? absoluteUrl(imageUrl) : null);
}

export const revalidate = 60;

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course?.published) {
    notFound();
  }

  const lessons = await getLessonsForCourse(course.id);
  const imageUrl = resolveCourseImageUrl(course.image_url);
  const durationLabel = getCourseDurationLabel(course, lessons);
  const certificate = hasCourseCertificate(course);
  const schemaImage = imageUrl ? absoluteUrl(imageUrl) : null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [buildCourseSchema(course, schemaImage)],
        }}
      />
      <LandingTopbar />
      <main className="shell py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/#courses" className="text-sm text-muted hover:text-gold">
            ← До курсів
          </Link>

          <article className="mt-6 space-y-6">
            {imageUrl && (
              <div className="course-detail-cover">
                <Image
                  src={imageUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>
            )}

            <div className="space-y-3">
              <p className="eyebrow">{formatCourseFormat(course.format)}</p>
              <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-cream">
                {course.title}
              </h1>
              <p className="text-sm leading-relaxed text-cream-body">{course.description}</p>
              {course.detailed_description && (
                <CourseDetailedDescription text={course.detailed_description} />
              )}
            </div>

            <div className="card space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CoursePrice course={course} size="lg" />
                <CourseBuyButton course={course} />
              </div>

              <dl className="services-meta">
                <div>
                  <dt>Формат</dt>
                  <dd>{formatCourseFormat(course.format)}</dd>
                </div>
                <div>
                  <dt>Тривалість</dt>
                  <dd>{durationLabel}</dd>
                </div>
                <div>
                  <dt>Уроків</dt>
                  <dd>{lessons.length > 0 ? lessons.length : "Уточнюється"}</dd>
                </div>
                <div>
                  <dt>Сертифікат</dt>
                  <dd>{certificate ? "Так, після 100% проходження" : "Не передбачено"}</dd>
                </div>
              </dl>

              {course.features.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-cream">Що входить у навчання</p>
                  <ul className="course-detail-features">
                    {course.features.map((item) => (
                      <li key={item}>
                        <IconCheck className="course-detail-feature-icon" />
                        <span>{item}</span>
                      </li>
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
            </div>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

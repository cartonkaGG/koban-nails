import { notFound } from "next/navigation";
import { CourseDetailedDescription } from "@/components/course-detailed-description";
import { CourseDetailHero } from "@/components/course/course-detail-hero";
import { CourseFinalCta } from "@/components/course/course-final-cta";
import { CourseWhyBuy } from "@/components/course/course-why-buy";
import { CoursePainPoints } from "@/components/course/course-pain-points";
import { CourseStickyCta } from "@/components/course/course-sticky-cta";
import { LandingTopbar } from "@/components/landing/topbar";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { getCourseBySlug } from "@/lib/data";
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

  const schemaImage = resolveCourseImageUrl(course.image_url);
  const schemaImageUrl = schemaImage ? absoluteUrl(schemaImage) : null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [buildCourseSchema(course, schemaImageUrl)],
        }}
      />
      <LandingTopbar />
      <main className="course-detail-page">
        <CourseDetailHero course={course} imageUrl={schemaImage} />

        <div className="shell course-detail-body">
          <CourseWhyBuy course={course} />

          {course.detailed_description && (
            <section className="course-program">
              <h2 className="course-program-title">Програма</h2>
              <CourseDetailedDescription text={course.detailed_description} />
            </section>
          )}
        </div>

        <CoursePainPoints course={course} />
        <CourseFinalCta course={course} />
        <CourseStickyCta course={course} />
      </main>
      <SiteFooter />
    </>
  );
}

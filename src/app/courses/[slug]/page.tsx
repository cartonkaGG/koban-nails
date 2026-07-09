import { notFound } from "next/navigation";
import { CourseDetailV2 } from "@/components/course-v2/course-detail-v2";
import { LandingV2Header } from "@/components/landing-v2/header";
import { LandingV2Footer } from "@/components/landing-v2/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { getCourseBySlug, getLessonsForCourseCatalog } from "@/lib/data";
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

  const lessons = await getLessonsForCourseCatalog(course.id);

  const schemaImage = resolveCourseImageUrl(course.image_url);
  const schemaImageUrl = schemaImage ? absoluteUrl(schemaImage) : null;

  return (
    <div className="v2-landing">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [buildCourseSchema(course, schemaImageUrl)],
        }}
      />
      <LandingV2Header linkBase="/" />
      <CourseDetailV2 course={course} lessons={lessons} imageUrl={schemaImage} />
      <LandingV2Footer />
    </div>
  );
}

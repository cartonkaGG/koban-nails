import { LandingV2Header } from "@/components/landing-v2/header";
import { LandingV2Hero } from "@/components/landing-v2/hero";
import { LandingV2Stats } from "@/components/landing-v2/stats";
import { LandingV2Courses } from "@/components/landing-v2/courses";
import { LandingV2About } from "@/components/landing-v2/about";
import { LandingV2Features } from "@/components/landing-v2/features";
import { LandingV2Reviews } from "@/components/landing-v2/reviews";
import { LandingV2Cta } from "@/components/landing-v2/cta";
import { LandingV2Footer } from "@/components/landing-v2/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedCourses } from "@/lib/data";
import { resolveCourseImageUrl } from "@/lib/images";
import { buildHomeGraph } from "@/lib/seo";
import type { Metadata } from "next";

/** Always fetch live course prices — admin edits must show up on cards immediately. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const courses = await getPublishedCourses();
  const onlineCourses = courses.filter((course) => course.format === "online");
  const courseImages = Object.fromEntries(
    onlineCourses.map((course) => [course.slug, resolveCourseImageUrl(course.image_url)]),
  );

  return (
    <>
      <JsonLd data={buildHomeGraph(onlineCourses, courseImages)} />
      <div className="v2-landing">
        <LandingV2Header />
        <main id="top">
          <LandingV2Hero />
          <LandingV2Stats />
          <LandingV2Courses courses={courses} />
          <LandingV2About />
          <LandingV2Features />
          <LandingV2Reviews />
          <LandingV2Cta />
        </main>
        <LandingV2Footer />
      </div>
    </>
  );
}

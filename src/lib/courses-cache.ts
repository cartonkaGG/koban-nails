import { unstable_cache } from "next/cache";
import { getCourseBySlug, getPublishedCourses } from "@/lib/data";

export const getCachedPublishedCourses = unstable_cache(
  async () => getPublishedCourses(),
  ["published-courses"],
  { revalidate: 60, tags: ["courses"] },
);

export function getCachedCourseBySlug(slug: string) {
  return unstable_cache(
    async () => getCourseBySlug(slug),
    ["course-by-slug", slug],
    { revalidate: 60, tags: ["courses"] },
  )();
}

import { unstable_cache } from "next/cache";
import { getPublishedCourses } from "@/lib/data";

export const getCachedPublishedCourses = unstable_cache(
  async () => getPublishedCourses(),
  ["published-courses"],
  { revalidate: 120, tags: ["courses"] },
);

import { unstable_cache } from "next/cache";
import { getPublishedCourses } from "@/lib/data";

/** Used only by low-traffic surfaces (sitemap). Storefront pages fetch live. */
export const getCachedPublishedCourses = unstable_cache(
  async () => getPublishedCourses(),
  ["published-courses"],
  { revalidate: 300, tags: ["courses"] },
);

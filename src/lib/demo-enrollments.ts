import { cookies } from "next/headers";
import { DEMO_COURSES, DEMO_ENROLLMENTS } from "@/lib/demo-data";
import type { Enrollment } from "@/lib/types";

const COOKIE = "koban_demo_enrolled";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 400,
};

function parseSlugs(raw?: string) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export async function getDemoEnrollmentsForUser(userId: string): Promise<Enrollment[]> {
  const base = DEMO_ENROLLMENTS.filter((e) => e.user_id === userId);
  const store = await cookies();
  const slugs = parseSlugs(store.get(COOKIE)?.value);

  const extra = slugs
    .map((slug) => {
      const course = DEMO_COURSES.find((c) => c.slug === slug);
      if (!course || base.some((e) => e.course_id === course.id)) return null;
      return {
        id: `demo-${slug}`,
        user_id: userId,
        course_id: course.id,
        status: "active" as const,
        purchased_at: new Date().toISOString(),
        completed_at: null,
        created_at: new Date().toISOString(),
        course,
      };
    })
    .filter(Boolean) as Enrollment[];

  return [...base, ...extra];
}

export async function addDemoEnrollment(slug: string) {
  const store = await cookies();
  const slugs = parseSlugs(store.get(COOKIE)?.value);
  if (!slugs.includes(slug)) slugs.push(slug);
  store.set(COOKIE, JSON.stringify(slugs), COOKIE_OPTS);
}

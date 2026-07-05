import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/auth";
import { getDemoEnrollmentsForUser } from "@/lib/demo-enrollments";
import {
  DEMO_COURSES,
  DEMO_ENROLLMENTS,
  DEMO_LESSONS,
  DEMO_PROFILE,
  DEMO_ADMIN,
} from "@/lib/demo-data";
import type { Course, Enrollment, Lesson } from "@/lib/types";

function mapCourse(row: Record<string, unknown>): Course {
  return {
    ...row,
    sale_price_uah: (row.sale_price_uah as number | null | undefined) ?? null,
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
  } as Course;
}

export async function getPublishedCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) return DEMO_COURSES;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .order("sort_order");

    if (error) {
      console.error("getPublishedCourses:", error.message);
      return DEMO_COURSES;
    }

    const courses = (data ?? []).map(mapCourse);
    return courses.length > 0 ? courses : DEMO_COURSES;
  } catch (error) {
    console.error("getPublishedCourses:", error);
    return DEMO_COURSES;
  }
}

export async function getAllCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) return DEMO_COURSES;

  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .order("sort_order");

  return (data ?? []).map(mapCourse);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_COURSES.find((c) => c.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data ? mapCourse(data) : null;
}

export async function getCourseById(id: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_COURSES.find((c) => c.id === id) ?? null;
  }

  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data ? mapCourse(data) : null;
}

export async function getLessonsForCourse(courseId: string, admin = false): Promise<Lesson[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_LESSONS.filter((l) => l.course_id === courseId);
  }

  const supabase = admin ? await createAdminClient() : await createClient();
  const { data } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order");

  return (data ?? []) as Lesson[];
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  if (!isSupabaseConfigured()) {
    return getDemoEnrollmentsForUser(userId);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("*, course:courses(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    ...row,
    course: row.course ? mapCourse(row.course as Record<string, unknown>) : undefined,
  })) as Enrollment[];
}

export async function getEnrollment(userId: string, courseId: string) {
  if (!isSupabaseConfigured()) {
    const enrollments = await getDemoEnrollmentsForUser(userId);
    return enrollments.find((e) => e.user_id === userId && e.course_id === courseId) ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  return data;
}

export async function getAdminStats() {
  if (!isSupabaseConfigured()) {
    return {
      courses: DEMO_COURSES.length,
      students: 24,
      activeEnrollments: 18,
      revenue: 312400,
    };
  }

  const supabase = await createAdminClient();
  const [courses, students, enrollments] = await Promise.all([
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("enrollments").select("id, course:courses(price_uah)", { count: "exact" }).eq("status", "active"),
  ]);

  const revenue = (enrollments.data ?? []).reduce((sum, row) => {
    const course = row.course as { price_uah?: number } | null;
    return sum + (course?.price_uah ?? 0);
  }, 0);

  return {
    courses: courses.count ?? 0,
    students: students.count ?? 0,
    activeEnrollments: enrollments.count ?? 0,
    revenue,
  };
}

export async function getAllProfiles() {
  if (!isSupabaseConfigured()) {
    return [DEMO_PROFILE, DEMO_ADMIN];
  }

  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as import("@/lib/types").Profile[];
}

export async function getRecentEnrollmentsAdmin(limit = 6) {
  if (!isSupabaseConfigured()) {
    return DEMO_ENROLLMENTS.map((e) => ({
      ...e,
      profile: DEMO_PROFILE,
    })).slice(0, limit);
  }

  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("enrollments")
    .select("*, course:courses(*), profile:profiles(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getAllEnrollmentsAdmin() {
  if (!isSupabaseConfigured()) {
    return DEMO_ENROLLMENTS.map((e) => ({
      ...e,
      profile: DEMO_PROFILE,
    }));
  }

  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("enrollments")
    .select("*, course:courses(*), profile:profiles(*)")
    .order("created_at", { ascending: false });

  return data ?? [];
}

import { notFound, redirect } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/cabinet-shell";
import { CoursePlayer } from "@/components/cabinet/course-player";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import {
  getCourseBySlug,
  getEnrollment,
  getLessonsForCourse,
} from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfile();
  if (!profile) redirect(`/?auth=login&next=/cabinet/courses/${slug}`);
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const enrollment = await getEnrollment(profile.id, course.id);
  if (!enrollment || enrollment.status !== "active") {
    redirect("/cabinet");
  }

  const lessons = await getLessonsForCourse(course.id);

  let completedLessonIds: string[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", profile.id)
      .eq("completed", true);
    completedLessonIds = (data ?? []).map((row) => row.lesson_id);
  } else {
    completedLessonIds = ["l1"];
  }

  return (
    <CabinetShell profile={profile}>
      <CoursePlayer
        course={course}
        lessons={lessons}
        completedLessonIds={completedLessonIds}
      />
    </CabinetShell>
  );
}

import dynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/cabinet-shell";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import {
  getCourseBySlug,
  getEnrollment,
  getLessonsForCourse,
} from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const CoursePlayer = dynamic(
  () => import("@/components/cabinet/course-player").then((m) => m.CoursePlayer),
  { loading: () => <div className="cabinet-empty"><p>Завантаження курсу...</p></div> },
);

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

  const [enrollment, lessons] = await Promise.all([
    getEnrollment(profile.id, course.id),
    getLessonsForCourse(course.id),
  ]);

  if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
    redirect("/cabinet");
  }

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
        certificateAvailable={Boolean(course.certificate_template_url)}
        userFullName={profile.full_name}
      />
    </CabinetShell>
  );
}

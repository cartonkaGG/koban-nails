import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { CourseEditor } from "@/components/admin/course-editor";
import { requireAdmin } from "@/lib/auth";
import { getCourseById, getCourseEnrollmentCount, getLessonsForCourse } from "@/lib/data";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    redirect("/?auth=login&next=/admin");
  }

  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) notFound();

  const lessons = await getLessonsForCourse(course.id, true);
  const enrollmentCount = await getCourseEnrollmentCount(course.id);

  return (
    <AdminShell profile={profile}>
      <CourseEditor course={course} lessons={lessons} enrollmentCount={enrollmentCount} />
    </AdminShell>
  );
}

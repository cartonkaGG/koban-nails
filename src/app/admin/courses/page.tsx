import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCoursesList } from "@/components/admin/admin-courses-list";
import { requireAdmin } from "@/lib/auth";
import { getAllCourses } from "@/lib/data";

export default async function AdminCoursesPage() {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    redirect("/?auth=login&next=/admin/courses");
  }

  const courses = await getAllCourses();

  return (
    <AdminShell profile={profile}>
      <AdminCoursesList courses={courses} />
    </AdminShell>
  );
}

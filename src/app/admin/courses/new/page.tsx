import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { NewCourseForm } from "@/components/admin/new-course-form";
import { requireAdmin } from "@/lib/auth";

export default async function NewCoursePage() {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    redirect("/login?next=/admin/courses/new");
  }

  return (
    <AdminShell profile={profile}>
      <NewCourseForm />
    </AdminShell>
  );
}

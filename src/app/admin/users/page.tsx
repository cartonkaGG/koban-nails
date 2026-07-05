import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { UsersAdmin } from "@/components/admin/users-admin";
import { requireAdmin } from "@/lib/auth";
import { getAllCourses, getAllEnrollmentsAdmin, getAllProfiles } from "@/lib/data";

export default async function AdminUsersPage() {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    redirect("/?auth=login&next=/admin/users");
  }

  const [profiles, enrollments, courses] = await Promise.all([
    getAllProfiles(),
    getAllEnrollmentsAdmin(),
    getAllCourses(),
  ]);

  return (
    <AdminShell profile={profile}>
      <div className="mb-8">
        <p className="eyebrow">аудиторія</p>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl">Учні та доступи</h2>
        <p className="mt-2 text-sm text-cream-body">
          Редагуйте імена, видавайте курси та керуйте доступами.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-sm text-muted">Усього профілів</p>
          <p className="mt-2 text-3xl font-bold">{profiles.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted">Записи на курси</p>
          <p className="mt-2 text-3xl font-bold">{enrollments.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted">Адміністратори</p>
          <p className="mt-2 text-3xl font-bold">{profiles.filter((p) => p.role === "admin").length}</p>
        </div>
      </div>

      <UsersAdmin
        profiles={profiles as never[]}
        enrollments={enrollments as never[]}
        courses={courses}
      />
    </AdminShell>
  );
}

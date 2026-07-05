import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats, getAllEnrollmentsAdmin } from "@/lib/data";
import { formatPrice } from "@/lib/types";

export default async function AdminDashboardPage() {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    redirect("/?auth=login&next=/admin");
  }

  const [stats, enrollments] = await Promise.all([
    getAdminStats(),
    getAllEnrollmentsAdmin(),
  ]);

  return (
    <AdminShell profile={profile}>
      <div className="mb-8">
        <p className="eyebrow">огляд</p>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl">Дашборд</h2>
        <p className="mt-2 text-sm text-cream-body">Курси, учні та активність платформи.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Курси", stats.courses],
          ["Учні", stats.students],
          ["Активні записи", stats.activeEnrollments],
          ["Дохід (активні)", formatPrice(stats.revenue)],
        ].map(([label, value]) => (
          <div key={label} className="stat-card">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-bold text-cream">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-medium">Останні записи</h3>
            <Link href="/admin/users" className="text-sm text-gold hover:underline">Усі учні</Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Учень</th>
                  <th>Курс</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.slice(0, 6).map((row) => {
                  const enrollment = row as {
                    id: string;
                    status: string;
                    profile?: { full_name?: string; email: string };
                    course?: { title: string };
                  };
                  return (
                    <tr key={enrollment.id}>
                      <td>{enrollment.profile?.full_name ?? enrollment.profile?.email ?? "—"}</td>
                      <td>{enrollment.course?.title ?? "—"}</td>
                      <td className="capitalize">{enrollment.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card space-y-3">
          <h3 className="font-medium">Швидкі дії</h3>
          <Link href="/admin/courses" className="btn btn-primary w-full">Керувати курсами</Link>
          <Link href="/admin/courses/new" className="btn btn-ghost w-full">Додати новий курс</Link>
          <Link href="/" className="btn btn-ghost w-full">Переглянути сайт</Link>
        </section>
      </div>
    </AdminShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAllCourses } from "@/lib/data";
import { formatPrice } from "@/lib/types";

export default async function AdminCoursesPage() {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    redirect("/login?next=/admin/courses");
  }

  const courses = await getAllCourses();

  return (
    <AdminShell profile={profile}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">контент</p>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl">Курси</h2>
        </div>
        <Link href="/admin/courses/new" className="btn btn-primary">Додати курс</Link>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Формат</th>
              <th>Ціна</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="font-medium text-cream">{course.title}</td>
                <td>{course.format}</td>
                <td>{formatPrice(course.price_uah)}</td>
                <td>{course.published ? "Опубліковано" : "Чернетка"}</td>
                <td>
                  <Link href={`/admin/courses/${course.id}`} className="text-gold hover:underline">
                    Редагувати
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

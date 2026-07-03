"use client";

type EnrollmentRow = {
  id: string;
  status: string;
  profile?: { full_name?: string | null; email: string };
  course?: { title: string };
};

export function EnrollmentActions({ rows }: { rows: EnrollmentRow[] }) {
  async function updateStatus(enrollmentId: string, status: string) {
    await fetch("/api/admin/enrollments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, status }),
    });
    window.location.reload();
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Учень</th>
            <th>Email</th>
            <th>Курс</th>
            <th>Статус</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.profile?.full_name ?? "—"}</td>
              <td>{row.profile?.email ?? "—"}</td>
              <td>{row.course?.title ?? "—"}</td>
              <td className="capitalize">{row.status}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-ghost min-h-8 px-2 text-xs" onClick={() => updateStatus(row.id, "active")}>
                    Активувати
                  </button>
                  <button type="button" className="btn btn-ghost min-h-8 px-2 text-xs" onClick={() => updateStatus(row.id, "pending")}>
                    Очікує
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

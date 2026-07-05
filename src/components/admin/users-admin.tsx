"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "student" | "admin";
};

type EnrollmentRow = {
  id: string;
  status: string;
  user_id: string;
  course_id: string;
  profile?: { full_name?: string | null; email: string };
  course?: { title: string; id: string };
};

type Props = {
  profiles: ProfileRow[];
  enrollments: EnrollmentRow[];
  courses: Course[];
};

export function UsersAdmin({ profiles, enrollments, courses }: Props) {
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { full_name: string; phone: string }>>(() =>
    Object.fromEntries(
      profiles.map((p) => [p.id, { full_name: p.full_name ?? "", phone: p.phone ?? "" }]),
    ),
  );
  const [grant, setGrant] = useState({ userId: "", courseId: "" });

  async function saveProfile(id: string) {
    setMessage("");
    const draft = drafts[id];
    const res = await fetch(`/api/admin/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setMessage(res.ok ? "Профіль збережено" : "Помилка збереження");
  }

  async function grantCourse() {
    if (!grant.userId || !grant.courseId) return;
    setMessage("");
    const res = await fetch("/api/admin/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: grant.userId, courseId: grant.courseId, status: "active" }),
    });
    setMessage(res.ok ? "Курс видано" : "Помилка видачі курсу");
    if (res.ok) window.location.reload();
  }

  async function updateStatus(enrollmentId: string, status: string) {
    setMessage("");
    const res = await fetch("/api/admin/enrollments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, status }),
    });
    setMessage(res.ok ? "Статус оновлено" : "Помилка оновлення");
    if (res.ok) window.location.reload();
  }

  const onlineCourses = courses.filter((c) => c.format === "online");

  return (
    <div className="space-y-8">
      {message && <p className="text-sm text-gold">{message}</p>}

      <section className="card space-y-4">
        <h3 className="font-medium">Видати курс учню</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <select
            className="field"
            value={grant.userId}
            onChange={(e) => setGrant((g) => ({ ...g, userId: e.target.value }))}
          >
            <option value="">Оберіть учня</option>
            {profiles
              .filter((p) => p.role === "student")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.email}
                </option>
              ))}
          </select>
          <select
            className="field"
            value={grant.courseId}
            onChange={(e) => setGrant((g) => ({ ...g, courseId: e.target.value }))}
          >
            <option value="">Оберіть курс</option>
            {onlineCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" onClick={grantCourse}>
            Видати доступ
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="mb-4 font-medium">Учні</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ім&apos;я та прізвище</th>
                <th>Email</th>
                <th>Телефон</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {profiles
                .filter((p) => p.role === "student")
                .map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        className="field min-h-9 py-1 text-sm"
                        value={drafts[row.id]?.full_name ?? ""}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [row.id]: { ...d[row.id], full_name: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td className="text-sm text-muted">{row.email}</td>
                    <td>
                      <input
                        className="field min-h-9 py-1 text-sm"
                        value={drafts[row.id]?.phone ?? ""}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [row.id]: { ...d[row.id], phone: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost min-h-8 px-2 text-xs"
                        onClick={() => saveProfile(row.id)}
                      >
                        Зберегти
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3 className="mb-4 font-medium">Записи на курси</h3>
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
              {enrollments.map((row) => (
                <tr key={row.id}>
                  <td>{row.profile?.full_name ?? "—"}</td>
                  <td>{row.profile?.email ?? "—"}</td>
                  <td>{row.course?.title ?? "—"}</td>
                  <td className="capitalize">{row.status}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost min-h-8 px-2 text-xs"
                        onClick={() => updateStatus(row.id, "active")}
                      >
                        Активувати
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost min-h-8 px-2 text-xs"
                        onClick={() => updateStatus(row.id, "cancelled")}
                      >
                        Скасувати
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

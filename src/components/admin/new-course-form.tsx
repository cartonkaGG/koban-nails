"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("Новий курс");
  const [slug, setSlug] = useState(`course-${Date.now()}`);
  const [format, setFormat] = useState<"online" | "offline">("online");
  const [loading, setLoading] = useState(false);

  async function createCourse() {
    setLoading(true);
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, format, price_uah: 0, features: [] }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/courses/${data.id}`);
    }
  }

  return (
    <div className="card mx-auto max-w-xl space-y-4">
      <h2 className="font-[family-name:var(--font-playfair)] text-2xl">Новий курс</h2>
      <label className="block text-sm">
        <span className="mb-2 block text-muted">Назва</span>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="mb-2 block text-muted">Slug</span>
        <input className="field" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="mb-2 block text-muted">Формат</span>
        <select className="field" value={format} onChange={(e) => setFormat(e.target.value as "online" | "offline")}>
          <option value="online">Онлайн</option>
          <option value="offline">Офлайн</option>
        </select>
      </label>
      <div className="flex gap-3">
        <button type="button" className="btn btn-primary" onClick={createCourse} disabled={loading}>
          {loading ? "Створення..." : "Створити"}
        </button>
        <Link href="/admin/courses" className="btn btn-ghost">Скасувати</Link>
      </div>
    </div>
  );
}

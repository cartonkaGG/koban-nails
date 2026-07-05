"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("Новий курс");
  const [slug, setSlug] = useState(`course-${Date.now()}`);
  const [format, setFormat] = useState<"online" | "offline">("online");
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createCourse() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, format, price_uah: 0, features: [], published }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Не вдалося створити курс");
      return;
    }

    if (data.id) {
      router.push(`/admin/courses/${data.id}`);
      router.refresh();
    }
  }

  return (
    <div className="card mx-auto max-w-xl space-y-4">
      <h2 className="font-[family-name:var(--font-playfair)] text-2xl">Новий курс</h2>
      <p className="text-sm text-cream-body">
        Щоб курс з&apos;явився на головній, увімкніть «Опублікувати одразу» або зробіть це пізніше
        в розділі «Публікація».
      </p>
      <label className="block text-sm">
        <span className="mb-2 block text-muted">Назва</span>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="mb-2 block text-muted">Slug</span>
        <input className="field font-mono text-xs" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="mb-2 block text-muted">Формат</span>
        <select className="field" value={format} onChange={(e) => setFormat(e.target.value as "online" | "offline")}>
          <option value="online">Онлайн (показується на сайті)</option>
          <option value="offline">Офлайн (лише в адмінці)</option>
        </select>
      </label>
      <label className="admin-toggle-row rounded-lg border border-line px-3 py-2">
        <div>
          <span className="font-medium">Опублікувати одразу</span>
          <p className="text-xs text-muted">Курс з&apos;явиться в блоці «Курси» на головній</p>
        </div>
        <input
          type="checkbox"
          className="admin-toggle-input"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
      </label>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex gap-3">
        <button type="button" className="btn btn-primary" onClick={createCourse} disabled={loading}>
          {loading ? "Створення..." : "Створити"}
        </button>
        <Link href="/admin/courses" className="btn btn-ghost">Скасувати</Link>
      </div>
    </div>
  );
}

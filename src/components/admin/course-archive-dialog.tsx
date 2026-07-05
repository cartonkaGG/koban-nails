"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/lib/types";

type Mode = "archive" | "purge";

type Props = {
  course: Course;
  open: boolean;
  mode?: Mode;
  enrollmentCount?: number;
  onClose: () => void;
  onSuccess: () => void;
};

export function CourseArchiveDialog({
  course,
  open,
  mode = "archive",
  enrollmentCount = 0,
  onClose,
  onSuccess,
}: Props) {
  const [slugInput, setSlugInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setSlugInput("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const slugMatches = slugInput.trim().toLowerCase() === course.slug.toLowerCase();
  const isArchive = mode === "archive";

  async function submit() {
    if (!slugMatches) {
      setError("Slug не збігається");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmSlug: slugInput.trim(),
          purge: !isArchive,
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Помилка");
        return;
      }

      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-archive-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="course-archive-title" className="font-[family-name:var(--font-playfair)] text-xl">
          {isArchive ? "Архівувати курс?" : "Видалити назавжди?"}
        </h3>

        {isArchive ? (
          <p className="mt-3 text-sm leading-relaxed text-cream-body">
            Курс <strong className="text-cream">«{course.title}»</strong> зникне з сайту, але{" "}
            <strong className="text-cream">записи про покупку та доступ учнів збережуться</strong>.
            Уроки й файли лишаються в системі.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-cream-body">
            Курс <strong className="text-cream">«{course.title}»</strong> буде видалено назавжди разом
            з уроками та файлами. Цю дію не можна скасувати.
          </p>
        )}

        {enrollmentCount > 0 && isArchive && (
          <p className="mt-2 rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs text-cream-body">
            Записів про покупку: <strong className="text-gold">{enrollmentCount}</strong> — вони
            залишаться в системі.
          </p>
        )}

        {!isArchive && enrollmentCount > 0 && (
          <p className="mt-2 text-xs text-red-300">
            Є записи про покупку — повне видалення недоступне. Використайте архівацію.
          </p>
        )}

        <label className="mt-5 block text-sm">
          <span className="mb-2 block text-muted">
            Для підтвердження введіть slug:{" "}
            <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs text-gold">
              {course.slug}
            </code>
          </span>
          <input
            className="field font-mono text-sm"
            value={slugInput}
            onChange={(e) => {
              setSlugInput(e.target.value);
              setError("");
            }}
            placeholder={course.slug}
            autoComplete="off"
            autoFocus
          />
        </label>

        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost min-h-10 flex-1" onClick={onClose} disabled={loading}>
            Скасувати
          </button>
          <button
            type="button"
            className="btn btn-danger min-h-10 flex-1"
            onClick={submit}
            disabled={loading || !slugMatches || (!isArchive && enrollmentCount > 0)}
          >
            {loading ? "Обробка..." : isArchive ? "Архівувати" : "Видалити назавжди"}
          </button>
        </div>
      </div>
    </div>
  );
}

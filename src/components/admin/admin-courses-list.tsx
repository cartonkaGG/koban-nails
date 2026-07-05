"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Course } from "@/lib/types";
import { formatPrice, getEffectiveCoursePrice, isCourseOnSale } from "@/lib/types";
import { resolveCourseImageUrl } from "@/lib/images";
import { MotionPage, MotionStagger, MotionItem } from "@/components/motion";

type Props = {
  courses: Course[];
};

export function AdminCoursesList({ courses }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const visibleCourses = useMemo(
    () => courses.filter((course) => !removedIds.includes(course.id)),
    [courses, removedIds],
  );

  async function deleteCourse(course: Course) {
    const confirmed = window.confirm(
      `Видалити курс «${course.title}»?\n\nУсі уроки, записи про покупки та завантажені файли також буде видалено. Цю дію не можна скасувати.`,
    );
    if (!confirmed) return;

    setDeletingId(course.id);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        window.alert(data.error ?? "Не вдалося видалити курс");
        return;
      }
      setRemovedIds((prev) => [...prev, course.id]);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = useMemo(() => {
    return visibleCourses.filter((course) => {
      if (filter === "published" && !course.published) return false;
      if (filter === "draft" && course.published) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        course.title.toLowerCase().includes(q) ||
        course.slug.toLowerCase().includes(q)
      );
    });
  }, [visibleCourses, query, filter]);

  return (
    <MotionPage>
      <div className="admin-courses-header">
        <div>
          <p className="eyebrow">контент</p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl">Курси</h2>
          <p className="mt-1 text-sm text-muted">{visibleCourses.length} програм · керуйте контентом і обкладинками</p>
        </div>
        <Link href="/admin/courses/new" className="btn btn-primary shrink-0">
          + Новий курс
        </Link>
      </div>

      <div className="admin-courses-toolbar">
        <input
          className="field admin-courses-search"
          placeholder="Пошук за назвою або slug..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="admin-courses-filters">
          {(
            [
              ["all", "Усі"],
              ["published", "Опубліковані"],
              ["draft", "Чернетки"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`admin-filter-chip ${filter === key ? "admin-filter-chip-active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-muted">Курсів не знайдено</p>
          {visibleCourses.length === 0 && (
            <Link href="/admin/courses/new" className="btn btn-primary mt-4">
              Створити перший курс
            </Link>
          )}
        </div>
      ) : (
        <MotionStagger className="admin-courses-grid">
          {filtered.map((course) => (
            <MotionItem key={course.id}>
              <AdminCourseCard
                course={course}
                deleting={deletingId === course.id}
                onDelete={() => deleteCourse(course)}
              />
            </MotionItem>
          ))}
        </MotionStagger>
      )}
    </MotionPage>
  );
}

function AdminCourseCard({
  course,
  deleting,
  onDelete,
}: {
  course: Course;
  deleting?: boolean;
  onDelete: () => void;
}) {
  const image = resolveCourseImageUrl(course.image_url);

  return (
    <article className="admin-course-card">
      <Link href={`/admin/courses/${course.id}`} className="admin-course-card-link">
        <div className="admin-course-card-media">
          {image ? (
            <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 320px" />
          ) : (
            <div className="admin-course-card-placeholder">
              <span>{course.title.slice(0, 1).toUpperCase()}</span>
            </div>
          )}
          <div className="admin-course-card-badges">
            <span className={`admin-status-badge ${course.published ? "admin-status-published" : "admin-status-draft"}`}>
              {course.published ? "Опубліковано" : "Чернетка"}
            </span>
            {course.featured && <span className="admin-status-badge admin-status-featured">★ Популярний</span>}
          </div>
        </div>

        <div className="admin-course-card-body">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-[family-name:var(--font-playfair)] text-lg leading-snug">{course.title}</h3>
            <span className="admin-format-tag">{course.format === "online" ? "Онлайн" : "Офлайн"}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{course.description}</p>
          <div className="admin-course-card-meta">
            {isCourseOnSale(course) ? (
              <>
                <span className="text-xs text-muted line-through">{formatPrice(course.price_uah)}</span>
                <span className="text-gold font-semibold">{formatPrice(getEffectiveCoursePrice(course))}</span>
              </>
            ) : (
              <span className="text-gold font-semibold">{formatPrice(course.price_uah)}</span>
            )}
            <span className="text-xs text-muted">/{course.slug}</span>
          </div>
        </div>
      </Link>

      <div className="admin-course-card-actions">
        <Link href={`/admin/courses/${course.id}`} className="btn btn-primary min-h-9 flex-1 px-3 text-xs">
          Редагувати
        </Link>
        {course.published && (
          <Link href="/#courses" className="btn btn-ghost min-h-9 px-3 text-xs" target="_blank">
            На сайті
          </Link>
        )}
        <button
          type="button"
          className="btn btn-danger min-h-9 px-3 text-xs"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? "..." : "Видалити"}
        </button>
      </div>
    </article>
  );
}

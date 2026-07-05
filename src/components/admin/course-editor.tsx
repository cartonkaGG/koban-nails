"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Course, Lesson } from "@/lib/types";
import { CourseArchiveDialog } from "@/components/admin/course-archive-dialog";
import { CourseCoverUpload } from "@/components/admin/course-cover-upload";
import { VideoUploadField } from "@/components/admin/video-upload";
import { MotionPage } from "@/components/motion";
import { resolveCourseImageUrl } from "@/lib/images";
import Image from "next/image";

type Tab = "overview" | "cover" | "lessons" | "publish";

type Props = {
  course: Course;
  lessons: Lesson[];
  enrollmentCount?: number;
};

const TABS: { id: Tab; label: string; onlineOnly?: boolean }[] = [
  { id: "overview", label: "Основне" },
  { id: "cover", label: "Обкладинка" },
  { id: "lessons", label: "Уроки", onlineOnly: true },
  { id: "publish", label: "Публікація" },
];

export function CourseEditor({ course, lessons: initialLessons, enrollmentCount = 0 }: Props) {
  const router = useRouter();
  const [courseState, setCourseState] = useState(course);
  const [lessons, setLessons] = useState(initialLessons);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [expandedLesson, setExpandedLesson] = useState<string | null>(
    initialLessons[0]?.id ?? null,
  );

  const visibleTabs = TABS.filter(
    (t) => !t.onlineOnly || courseState.format === "online",
  );

  async function saveCourse(partial?: Partial<Course>) {
    setSaving(true);
    setMessage("");
    const payload = { ...courseState, ...partial, features: courseState.features };
    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error ?? "Помилка збереження");
      return false;
    }

    if (partial) {
      setCourseState((prev) => ({ ...prev, ...partial }));
    }
    setMessage("✓ Збережено");
    return true;
  }

  async function restoreCourse() {
    setRestoring(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setMessage(data.error ?? "Помилка відновлення");
        return;
      }
      setCourseState((prev) => ({ ...prev, archived_at: null }));
      setMessage("✓ Курс відновлено з архіву");
      router.refresh();
    } finally {
      setRestoring(false);
    }
  }

  const isArchived = Boolean(courseState.archived_at);

  async function saveLesson(lesson: Lesson) {
    const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lesson),
    });
    setMessage(res.ok ? "✓ Урок збережено" : "Помилка збереження уроку");
  }

  async function addLesson() {
    const res = await fetch("/api/admin/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: course.id,
        title: "Новий урок",
        summary: "",
        content: "",
        duration_min: 10,
        sort_order: lessons.length + 1,
      }),
    });
    if (res.ok) {
      const lesson = await res.json();
      setLessons((prev) => [...prev, lesson]);
      setExpandedLesson(lesson.id);
      setTab("lessons");
      setMessage("Урок додано");
    }
  }

  const previewImage = resolveCourseImageUrl(courseState.image_url);

  return (
    <MotionPage className="admin-course-editor pb-24 lg:pb-8">
      <div className="admin-editor-header">
        <div className="min-w-0">
          <Link href="/admin/courses" className="text-xs text-muted hover:text-gold">
            ← Усі курси
          </Link>
          <h2 className="mt-1 truncate font-[family-name:var(--font-playfair)] text-xl sm:text-2xl">
            {courseState.title || "Без назви"}
          </h2>
        </div>
        {previewImage && (
          <div className="admin-editor-thumb hidden sm:block">
            <Image src={previewImage} alt="" fill className="object-cover" sizes="64px" />
          </div>
        )}
      </div>

      {isArchived && (
        <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-cream-body">
          Курс у <strong className="text-cream">архіві</strong> — не показується на сайті. Учні з
          активною покупкою зберігають доступ. Записів про покупку:{" "}
          <strong className="text-gold">{enrollmentCount}</strong>.
          <button
            type="button"
            className="btn btn-ghost ml-3 min-h-8 px-3 text-xs"
            onClick={restoreCourse}
            disabled={restoring}
          >
            {restoring ? "..." : "Відновити з архіву"}
          </button>
        </div>
      )}

      <nav className="admin-editor-tabs" aria-label="Розділи редагування">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-editor-tab ${tab === t.id ? "admin-editor-tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "lessons" && lessons.length > 0 && (
              <span className="admin-tab-count">{lessons.length}</span>
            )}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <section className="card space-y-4">
          <p className="text-sm text-muted">Назва, опис і ключові переваги курсу для сторінки продажу.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-2 block text-muted">Назва курсу</span>
              <input
                className="field"
                value={courseState.title}
                onChange={(e) => setCourseState({ ...courseState, title: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-muted">Slug (URL)</span>
              <input
                className="field font-mono text-xs"
                value={courseState.slug}
                onChange={(e) => setCourseState({ ...courseState, slug: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-muted">Формат</span>
              <select
                className="field"
                value={courseState.format}
                onChange={(e) =>
                  setCourseState({ ...courseState, format: e.target.value as Course["format"] })
                }
              >
                <option value="online">Онлайн</option>
                <option value="offline">Офлайн</option>
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-2 block text-muted">Короткий опис</span>
              <textarea
                className="field min-h-24"
                value={courseState.description}
                onChange={(e) => setCourseState({ ...courseState, description: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-muted">Ціна (грн)</span>
              <input
                type="number"
                className="field"
                value={courseState.price_uah}
                onChange={(e) =>
                  setCourseState({ ...courseState, price_uah: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-muted">Акційна ціна (грн)</span>
              <input
                type="number"
                className="field"
                placeholder="Без знижки"
                value={courseState.sale_price_uah ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  setCourseState({
                    ...courseState,
                    sale_price_uah: raw === "" ? null : Number(raw),
                  });
                }}
              />
              <span className="mt-1 block text-xs text-muted">
                Менша за звичайну ціну — показується як акція на сайті та при покупці
              </span>
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-muted">Бейдж (опційно)</span>
              <input
                className="field"
                placeholder="Новинка, Хіт..."
                value={courseState.badge ?? ""}
                onChange={(e) => setCourseState({ ...courseState, badge: e.target.value || null })}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-2 block text-muted">Переваги — кожен пункт з нового рядка</span>
              <textarea
                className="field min-h-32"
                value={courseState.features.join("\n")}
                onChange={(e) =>
                  setCourseState({
                    ...courseState,
                    features: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
          </div>
        </section>
      )}

      {tab === "cover" && (
        <section className="card space-y-4">
          <div>
            <h3 className="font-medium">Обкладинка курсу</h3>
            <p className="mt-1 text-sm text-muted">
              Відображається на головній сторінці та в кабінеті учня. Рекомендовано 16:10, мін. 800×500 px.
            </p>
          </div>
          <CourseCoverUpload
            courseId={course.id}
            value={courseState.image_url}
            onChange={(url) => setCourseState((prev) => ({ ...prev, image_url: url }))}
            onSaved={(url) => void saveCourse({ image_url: url })}
          />
        </section>
      )}

      {tab === "lessons" && courseState.format === "online" && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{lessons.length} уроків · натисніть на урок, щоб розгорнути</p>
            <button type="button" className="btn btn-ghost min-h-9 px-3 text-xs" onClick={addLesson}>
              + Додати урок
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="card py-10 text-center">
              <p className="text-muted">Уроків ще немає</p>
              <button type="button" className="btn btn-primary mt-4" onClick={addLesson}>
                Додати перший урок
              </button>
            </div>
          ) : (
            lessons.map((lesson, index) => {
              const open = expandedLesson === lesson.id;
              return (
                <div key={lesson.id} className={`admin-lesson-card ${open ? "admin-lesson-card-open" : ""}`}>
                  <button
                    type="button"
                    className="admin-lesson-header"
                    onClick={() => setExpandedLesson(open ? null : lesson.id)}
                  >
                    <span className="admin-lesson-num">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-left font-medium">
                      {lesson.title || "Без назви"}
                    </span>
                    <span className="text-xs text-muted">{lesson.duration_min} хв</span>
                    <svg
                      className={`admin-lesson-chevron ${open ? "admin-lesson-chevron-open" : ""}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  {open && (
                    <div className="admin-lesson-body space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm sm:col-span-2">
                          <span className="mb-2 block text-muted">Назва уроку</span>
                          <input
                            className="field"
                            value={lesson.title}
                            onChange={(e) =>
                              setLessons((prev) =>
                                prev.map((l) =>
                                  l.id === lesson.id ? { ...l, title: e.target.value } : l,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="mb-2 block text-muted">Тривалість (хв)</span>
                          <input
                            className="field"
                            type="number"
                            value={lesson.duration_min}
                            onChange={(e) =>
                              setLessons((prev) =>
                                prev.map((l) =>
                                  l.id === lesson.id
                                    ? { ...l, duration_min: Number(e.target.value) }
                                    : l,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className="block text-sm sm:col-span-2">
                          <span className="mb-2 block text-muted">Короткий опис</span>
                          <input
                            className="field"
                            value={lesson.summary}
                            onChange={(e) =>
                              setLessons((prev) =>
                                prev.map((l) =>
                                  l.id === lesson.id ? { ...l, summary: e.target.value } : l,
                                ),
                              )
                            }
                          />
                        </label>
                        <VideoUploadField
                          lessonId={lesson.id}
                          value={lesson.video_url ?? ""}
                          onUploaded={(videoUrl) =>
                            setLessons((prev) =>
                              prev.map((l) =>
                                l.id === lesson.id ? { ...l, video_url: videoUrl } : l,
                              ),
                            )
                          }
                        />
                        <label className="block text-sm sm:col-span-2">
                          <span className="mb-2 block text-muted">Текст уроку</span>
                          <textarea
                            className="field min-h-28"
                            value={lesson.content}
                            onChange={(e) =>
                              setLessons((prev) =>
                                prev.map((l) =>
                                  l.id === lesson.id ? { ...l, content: e.target.value } : l,
                                ),
                              )
                            }
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost min-h-9 px-3 text-xs"
                        onClick={() => saveLesson(lessons.find((l) => l.id === lesson.id)!)}
                      >
                        Зберегти урок
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      {tab === "publish" && (
        <section className="card space-y-5">
          <p className="text-sm text-muted">Налаштування видимості та оплати.</p>
          <p className="rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs text-cream-body">
            На головній показуються лише курси з форматом <strong className="text-cream">Онлайн</strong>,{" "}
            увімкненим «Опубліковано» і без архівації. Після збереження зміни з&apos;являться на сайті
            протягом хвилини.
          </p>

          <div className="admin-toggle-list">
            <label className="admin-toggle-row">
              <div>
                <span className="font-medium">Опубліковано</span>
                <p className="text-xs text-muted">Курс видно на сайті та доступний для покупки</p>
              </div>
              <input
                type="checkbox"
                className="admin-toggle-input"
                checked={courseState.published}
                onChange={(e) => setCourseState({ ...courseState, published: e.target.checked })}
              />
            </label>
            <label className="admin-toggle-row">
              <div>
                <span className="font-medium">Популярний</span>
                <p className="text-xs text-muted">Виділення на головній сторінці</p>
              </div>
              <input
                type="checkbox"
                className="admin-toggle-input"
                checked={courseState.featured}
                onChange={(e) => setCourseState({ ...courseState, featured: e.target.checked })}
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-2 block text-muted">Посилання на оплату (Monobank / LiqPay)</span>
            <input
              className="field"
              value={courseState.payment_url ?? ""}
              onChange={(e) => setCourseState({ ...courseState, payment_url: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-2 block text-muted">Порядок сортування</span>
            <input
              type="number"
              className="field w-32"
              value={courseState.sort_order}
              onChange={(e) =>
                setCourseState({ ...courseState, sort_order: Number(e.target.value) })
              }
            />
          </label>

          <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-red-200">Небезпечна зона</p>
            <p className="mt-1 text-xs text-muted">
              Архівація приховує курс з сайту, але зберігає записи про покупку ({enrollmentCount}) і
              доступ учнів. Для підтвердження потрібно ввести slug курсу.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!isArchived && (
                <button
                  type="button"
                  className="btn btn-danger min-h-9 px-4 text-xs"
                  onClick={() => setArchiveOpen(true)}
                  disabled={saving}
                >
                  Архівувати курс
                </button>
              )}
              {enrollmentCount === 0 && (
                <button
                  type="button"
                  className="btn btn-ghost min-h-9 border-red-500/30 px-4 text-xs text-red-200"
                  onClick={() => setPurgeOpen(true)}
                  disabled={saving}
                >
                  Видалити назавжди
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <CourseArchiveDialog
        course={courseState}
        open={archiveOpen}
        mode="archive"
        enrollmentCount={enrollmentCount}
        onClose={() => setArchiveOpen(false)}
        onSuccess={() => {
          router.push("/admin/courses?filter=archived");
          router.refresh();
        }}
      />

      <CourseArchiveDialog
        course={courseState}
        open={purgeOpen}
        mode="purge"
        enrollmentCount={enrollmentCount}
        onClose={() => setPurgeOpen(false)}
        onSuccess={() => {
          router.push("/admin/courses");
          router.refresh();
        }}
      />

      <div className="admin-editor-savebar">
        <div className="admin-editor-savebar-inner">
          {message && (
            <span className={`text-sm ${message.startsWith("✓") ? "text-gold" : "text-red-300"}`}>
              {message}
            </span>
          )}
          <button type="button" className="btn btn-primary" onClick={() => void saveCourse()} disabled={saving}>
            {saving ? "Збереження..." : "Зберегти курс"}
          </button>
        </div>
      </div>
    </MotionPage>
  );
}

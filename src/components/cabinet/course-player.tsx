"use client";

import { useMemo, useState } from "react";
import type { Course, Lesson } from "@/lib/types";
import { IconCheck, IconPlay } from "@/components/icons";

type Props = {
  course: Course;
  lessons: Lesson[];
  completedLessonIds: string[];
};

export function CoursePlayer({
  course,
  lessons,
  completedLessonIds: initialCompleted,
}: Props) {
  const [activeId, setActiveId] = useState(lessons[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState(initialCompleted);

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeId) ?? lessons[0],
    [activeId, lessons],
  );

  const progress = lessons.length
    ? Math.round((completedLessonIds.length / lessons.length) * 100)
    : 0;

  async function markComplete() {
    if (!activeLesson || completedLessonIds.includes(activeLesson.id)) return;
    setSaving(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: activeLesson.id }),
      });
      if (res.ok) {
        setCompletedLessonIds((prev) => [...prev, activeLesson.id]);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!activeLesson) {
    return (
      <div className="card text-sm text-muted">
        Уроки для цього курсу ще не додані. Зверніться до адміністратора.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="card h-fit lg:sticky lg:top-24">
        <div className="mb-4">
          <p className="eyebrow">{course.format === "online" ? "онлайн курс" : "програма"}</p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl">{course.title}</h2>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-muted">
              <span>Прогрес</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/50">
              <div className="h-full rounded-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <ol className="space-y-2">
          {lessons.map((lesson, index) => {
            const done = completedLessonIds.includes(lesson.id);
            const active = lesson.id === activeLesson.id;
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(lesson.id)}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                    active
                      ? "border-gold/50 bg-gold/10"
                      : "border-transparent hover:border-line hover:bg-white/5"
                  }`}
                >
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done ? "bg-gold text-black" : "bg-black/50 text-muted"
                  }`}>
                    {done ? <IconCheck className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-cream">{lesson.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{lesson.duration_min} хв</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <section className="card">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">урок</p>
            <h3 className="font-[family-name:var(--font-playfair)] text-3xl">{activeLesson.title}</h3>
            <p className="mt-2 text-sm text-cream-body">{activeLesson.summary}</p>
          </div>
          {!completedLessonIds.includes(activeLesson.id) && (
            <button type="button" className="btn btn-primary" onClick={markComplete} disabled={saving}>
              {saving ? "Зберігаємо..." : "Позначити пройденим"}
            </button>
          )}
        </div>

        <div className="mb-6 overflow-hidden rounded-xl border border-line bg-black/40">
          {activeLesson.video_url ? (
            <div className="aspect-video">
              <iframe
                src={activeLesson.video_url}
                title={activeLesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 text-center text-muted">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-panel">
                <IconPlay />
              </span>
              <p className="text-sm">Відео буде додано адміністратором</p>
            </div>
          )}
        </div>

        <article className="prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-7 text-cream-body">
            {activeLesson.content}
          </div>
        </article>
      </section>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Course, Lesson } from "@/lib/types";
import { IconCheck } from "@/components/icons";

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
    () => lessons.find((lesson) => lesson.id === activeId) ?? lessons[0],
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
      <div className="cabinet-empty">
        <p>Уроки для цього курсу ще не додані.</p>
      </div>
    );
  }

  const done = completedLessonIds.includes(activeLesson.id);

  return (
    <div className="cabinet-player">
      <div className="cabinet-player-head">
        <div>
          <p className="cabinet-player-eyebrow">{course.title}</p>
          <h1 className="cabinet-player-title">{activeLesson.title}</h1>
        </div>
        <div className="cabinet-player-progress">
          <span>{progress}%</span>
          <div className="cabinet-progress-bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="cabinet-player-layout">
        <aside className="cabinet-lessons">
          {lessons.map((lesson, index) => {
            const lessonDone = completedLessonIds.includes(lesson.id);
            const active = lesson.id === activeLesson.id;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setActiveId(lesson.id)}
                className={`cabinet-lesson-btn${active ? " active" : ""}${lessonDone ? " done" : ""}`}
              >
                <span className="cabinet-lesson-index">
                  {lessonDone ? <IconCheck className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="cabinet-lesson-text">
                  <span>{lesson.title}</span>
                  <span>{lesson.duration_min} хв</span>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="cabinet-lesson-view">
          <div className="cabinet-lesson-media">
            {activeLesson.video_url ? (
              <iframe
                src={activeLesson.video_url}
                title={activeLesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="cabinet-lesson-media-empty">
                <p>Відео буде додано незабаром</p>
              </div>
            )}
          </div>

          <div className="cabinet-lesson-content">
            <p className="cabinet-lesson-summary">{activeLesson.summary}</p>
            <div className="cabinet-lesson-body">{activeLesson.content}</div>
          </div>

          {!done && (
            <button
              type="button"
              className="btn btn-primary w-full sm:w-auto"
              onClick={markComplete}
              disabled={saving}
            >
              {saving ? "Зберігаємо..." : "Позначити пройденим"}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

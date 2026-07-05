"use client";

import { useMemo, useState } from "react";
import type { Course, Lesson } from "@/lib/types";
import { IconCheck } from "@/components/icons";
import { LessonVideo } from "@/components/cabinet/lesson-video";

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
  const [lessonsOpen, setLessonsOpen] = useState(false);

  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeId);
  const activeLesson = useMemo(
    () => lessons[activeIndex] ?? lessons[0],
    [activeIndex, lessons],
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
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < lessons.length - 1;

  return (
    <div className="cabinet-player">
      <div className="cabinet-player-head">
        <div className="cabinet-player-head-main">
          <p className="cabinet-player-eyebrow">{course.title}</p>
          <h1 className="cabinet-player-title">{activeLesson.title}</h1>
        </div>
        <div className="cabinet-player-progress">
          <span>{progress}% · {activeIndex + 1}/{lessons.length}</span>
          <div className="cabinet-progress-bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="cabinet-lesson-mobile-nav">
        <button
          type="button"
          className="cabinet-lesson-nav-btn"
          disabled={!hasPrev}
          onClick={() => setActiveId(lessons[activeIndex - 1].id)}
        >
          ←
        </button>
        <button
          type="button"
          className="cabinet-lesson-nav-current"
          onClick={() => setLessonsOpen((v) => !v)}
        >
          Урок {activeIndex + 1} з {lessons.length}
        </button>
        <button
          type="button"
          className="cabinet-lesson-nav-btn"
          disabled={!hasNext}
          onClick={() => setActiveId(lessons[activeIndex + 1].id)}
        >
          →
        </button>
      </div>

      {lessonsOpen && (
        <div className="cabinet-lessons-mobile-picker">
          {lessons.map((lesson, index) => {
            const lessonDone = completedLessonIds.includes(lesson.id);
            const active = lesson.id === activeLesson.id;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => {
                  setActiveId(lesson.id);
                  setLessonsOpen(false);
                }}
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
        </div>
      )}

      <div className="cabinet-player-layout">
        <aside className="cabinet-lessons cabinet-lessons-desktop">
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
            <LessonVideo
              lessonId={activeLesson.id}
              videoUrl={activeLesson.video_url}
              title={activeLesson.title}
            />
          </div>

          <div className="cabinet-lesson-content">
            {activeLesson.summary && (
              <p className="cabinet-lesson-summary">{activeLesson.summary}</p>
            )}
            {activeLesson.content && (
              <div className="cabinet-lesson-body">{activeLesson.content}</div>
            )}
          </div>

          {!done && (
            <button
              type="button"
              className="btn btn-primary cabinet-lesson-complete-btn"
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

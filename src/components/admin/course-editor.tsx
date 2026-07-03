"use client";

import { useState } from "react";
import type { Course, Lesson } from "@/lib/types";

type Props = {
  course: Course;
  lessons: Lesson[];
};

export function CourseEditor({ course, lessons: initialLessons }: Props) {
  const [courseState, setCourseState] = useState(course);
  const [lessons, setLessons] = useState(initialLessons);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveCourse() {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...courseState,
        features: courseState.features,
      }),
    });
    setSaving(false);
    setMessage(res.ok ? "Курс збережено" : "Помилка збереження");
  }

  async function saveLesson(lesson: Lesson) {
    const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lesson),
    });
    setMessage(res.ok ? "Урок збережено" : "Помилка збереження уроку");
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
      setMessage("Урок додано");
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl">Редагування курсу</h2>
          {message && <span className="text-sm text-gold">{message}</span>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-2 block text-muted">Назва</span>
            <input className="field" value={courseState.title} onChange={(e) => setCourseState({ ...courseState, title: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block text-muted">Slug</span>
            <input className="field" value={courseState.slug} onChange={(e) => setCourseState({ ...courseState, slug: e.target.value })} />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-2 block text-muted">Опис</span>
            <textarea className="field min-h-24" value={courseState.description} onChange={(e) => setCourseState({ ...courseState, description: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block text-muted">Ціна (грн)</span>
            <input type="number" className="field" value={courseState.price_uah} onChange={(e) => setCourseState({ ...courseState, price_uah: Number(e.target.value) })} />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block text-muted">Формат</span>
            <select className="field" value={courseState.format} onChange={(e) => setCourseState({ ...courseState, format: e.target.value as Course["format"] })}>
              <option value="online">Онлайн</option>
              <option value="offline">Офлайн</option>
            </select>
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-2 block text-muted">Переваги (кожен пункт з нового рядка)</span>
            <textarea
              className="field min-h-28"
              value={courseState.features.join("\n")}
              onChange={(e) => setCourseState({ ...courseState, features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-2 block text-muted">Посилання на оплату</span>
            <input className="field" value={courseState.payment_url ?? ""} onChange={(e) => setCourseState({ ...courseState, payment_url: e.target.value })} />
          </label>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={courseState.published} onChange={(e) => setCourseState({ ...courseState, published: e.target.checked })} />
            Опубліковано
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={courseState.featured} onChange={(e) => setCourseState({ ...courseState, featured: e.target.checked })} />
            Популярний
          </label>
        </div>

        <button type="button" className="btn btn-primary" onClick={saveCourse} disabled={saving}>
          {saving ? "Збереження..." : "Зберегти курс"}
        </button>
      </div>

      {courseState.format === "online" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-[family-name:var(--font-playfair)] text-xl">Уроки</h3>
            <button type="button" className="btn btn-ghost" onClick={addLesson}>Додати урок</button>
          </div>

          {lessons.map((lesson) => (
            <div key={lesson.id} className="card space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input className="field" value={lesson.title} onChange={(e) => setLessons((prev) => prev.map((l) => l.id === lesson.id ? { ...l, title: e.target.value } : l))} />
                <input className="field" placeholder="Тривалість (хв)" type="number" value={lesson.duration_min} onChange={(e) => setLessons((prev) => prev.map((l) => l.id === lesson.id ? { ...l, duration_min: Number(e.target.value) } : l))} />
                <input className="field md:col-span-2" placeholder="Короткий опис" value={lesson.summary} onChange={(e) => setLessons((prev) => prev.map((l) => l.id === lesson.id ? { ...l, summary: e.target.value } : l))} />
                <input className="field md:col-span-2" placeholder="URL відео (YouTube embed)" value={lesson.video_url ?? ""} onChange={(e) => setLessons((prev) => prev.map((l) => l.id === lesson.id ? { ...l, video_url: e.target.value } : l))} />
                <textarea className="field min-h-28 md:col-span-2" placeholder="Текст уроку" value={lesson.content} onChange={(e) => setLessons((prev) => prev.map((l) => l.id === lesson.id ? { ...l, content: e.target.value } : l))} />
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => saveLesson(lessons.find((l) => l.id === lesson.id)!)}>
                Зберегти урок
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

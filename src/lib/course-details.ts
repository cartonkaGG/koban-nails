import type { Course } from "@/lib/types";
import type { Lesson } from "@/lib/types";

export function formatCourseFormat(format: Course["format"]) {
  return format === "offline" ? "Офлайн" : "Онлайн";
}

export function getCourseDurationLabel(course: Course, lessons: Lesson[]) {
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.duration_min, 0);
  const hours = Math.max(1, Math.round(totalMinutes / 60));

  if (course.format === "online") {
    return lessons.length > 0 ? `≈ ${hours} год відео · у власному темпі` : "У власному темпі";
  }

  return "За розкладом Виконавця";
}

export function hasCourseCertificate(course: Course) {
  return Boolean(course.certificate_template_url);
}

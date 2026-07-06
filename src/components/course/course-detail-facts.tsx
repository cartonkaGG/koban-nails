import { IconCheck } from "@/components/icons";
import {
  formatCourseFormat,
  getCourseDurationLabel,
  hasCourseCertificate,
} from "@/lib/course-details";
import type { Course } from "@/lib/types";
import type { Lesson } from "@/lib/types";

type Props = {
  course: Course;
  lessons: Lesson[];
};

export function CourseDetailFacts({ course, lessons }: Props) {
  const durationLabel = getCourseDurationLabel(course, lessons);
  const certificate = hasCourseCertificate(course);

  const facts = [
    formatCourseFormat(course.format),
    durationLabel,
    lessons.length > 0 ? `${lessons.length} уроків` : null,
    certificate ? "Сертифікат після 100%" : null,
  ].filter(Boolean) as string[];

  return (
    <section className="course-facts" aria-label="Що входить">
      <ul className="course-facts-tags">
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>

      {course.features.length > 0 && (
        <ul className="course-facts-features">
          {course.features.map((item) => (
            <li key={item}>
              <IconCheck className="course-facts-icon" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {course.format === "online" && (
        <p className="course-facts-note">
          Після оплати — відеоуроки та прогрес у особистому кабінеті.
        </p>
      )}
    </section>
  );
}

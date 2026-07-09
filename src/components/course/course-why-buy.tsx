"use client";

import { IconCheck } from "@/components/icons";
import { getCourseMarketing } from "@/content/course-marketing";
import type { Course } from "@/lib/types";

type Props = {
  course: Course;
};

export function CourseWhyBuy({ course }: Props) {
  const marketing = getCourseMarketing(course);

  return (
    <section className="course-for-you" aria-labelledby="course-for-you-title">
      <div className="course-for-you-head">
        <span className="course-for-you-line" aria-hidden="true" />
        <h2 id="course-for-you-title" className="course-for-you-title">
          Цей курс для вас, якщо
        </h2>
        <span className="course-for-you-line" aria-hidden="true" />
      </div>

      <ul className="course-for-you-grid">
        {marketing.forYouIf.map((item) => (
          <li key={item.title} className="course-for-you-card">
            <span className="course-for-you-icon" aria-hidden="true">
              <IconCheck />
            </span>
            <h3 className="course-for-you-card-title">{item.title}</h3>
            <p className="course-for-you-card-text">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

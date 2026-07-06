import { getCourseMarketing } from "@/content/course-marketing";
import type { Course } from "@/lib/types";

type Props = {
  course: Course;
};

export function CoursePainPoints({ course }: Props) {
  const marketing = getCourseMarketing(course);

  return (
    <section className="course-pain" aria-labelledby="course-pain-title">
      <div className="shell">
        <div className="course-pain-head">
          <span className="course-pain-line" aria-hidden="true" />
          <h2 id="course-pain-title" className="course-pain-title">
            Можливо, ти стикалась із цим?
          </h2>
          <span className="course-pain-line" aria-hidden="true" />
        </div>

        <ol className="course-pain-list">
          {marketing.painPoints.map((item, index) => (
            <li key={item.title} className="course-pain-item">
              <span className="course-pain-num">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="course-pain-item-title">{item.title}</h3>
                <p className="course-pain-item-text">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

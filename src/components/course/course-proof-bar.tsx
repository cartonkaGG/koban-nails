import type { Course } from "@/lib/types";
import { getCourseMarketing } from "@/content/course-marketing";

type Props = {
  course: Course;
};

export function CourseProofBar({ course }: Props) {
  const marketing = getCourseMarketing(course);
  if (!marketing.proof.length) return null;

  return (
    <section className="course-proof-bar" aria-label="Соціальний доказ">
      <div className="shell course-proof-bar-inner">
        {marketing.proof.map((item) => (
          <div key={item} className="course-proof-bar-item">
            <span className="course-proof-bar-dot" aria-hidden />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

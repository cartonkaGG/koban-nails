import type { Course } from "@/lib/types";
import { getCourseMarketing } from "@/content/course-marketing";
import { CourseBuyButton } from "@/components/course-buy-button";
import { CoursePrice } from "@/components/course-price";
import { IconArrowRight } from "@/components/icons";

type Props = {
  course: Course;
};

export function CourseFinalCta({ course }: Props) {
  const marketing = getCourseMarketing(course);

  return (
    <section className="course-final-cta" aria-labelledby="course-final-cta-title">
      <div className="course-final-cta-glow" aria-hidden />
      <div className="shell course-final-cta-inner">
        <p className="course-final-cta-eyebrow">{marketing.tagline}</p>
        <h2 id="course-final-cta-title" className="course-final-cta-title">
          Готова почати навчання?
        </h2>
        <p className="course-final-cta-lead">{marketing.subheadline}</p>

        {marketing.proof.length > 0 && (
          <ul className="course-final-cta-proof">
            {marketing.proof.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        <div className="course-final-cta-price">
          <CoursePrice course={course} size="lg" />
        </div>

        <CourseBuyButton
          course={course}
          variant="sell"
          className="course-final-cta-btn"
          label="Записатися на курс"
          icon={<IconArrowRight className="h-4 w-4" />}
        />

        <p className="course-final-cta-note">
          Миттєвий доступ після оплати · Сертифікат після завершення
        </p>
      </div>
    </section>
  );
}

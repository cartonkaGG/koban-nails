"use client";

import { CourseBuyButton } from "@/components/course-buy-button";
import { OfferCountdown } from "@/components/course/offer-countdown";
import { CoursePrice } from "@/components/course-price";
import type { Course } from "@/lib/types";
import { isOfferCountdownEnabled } from "@/lib/types";

type Props = {
  course: Course;
};

export function CourseStickyCta({ course }: Props) {
  const showCountdown = isOfferCountdownEnabled(course);

  return (
    <div className="course-sticky-cta" role="region" aria-label="Швидка покупка">
      <div className="course-sticky-cta-inner">
        <div className="course-sticky-cta-meta">
          <CoursePrice course={course} size="sm" />
          {showCountdown && <OfferCountdown scope={course.slug} variant="inline" />}
        </div>
        <CourseBuyButton course={course} variant="sell" className="course-sticky-cta-btn" />
      </div>
    </div>
  );
}

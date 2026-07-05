"use client";

import Image from "next/image";
import type { Course } from "@/lib/types";
import { IconCheck, IconArrowRight } from "@/components/icons";
import { CourseBuyButton } from "@/components/course-buy-button";
import { CoursePrice } from "@/components/course-price";
import { resolveCourseImageUrl } from "@/lib/images";
import { isCourseOnSale } from "@/lib/types";
import { MotionFadeUp, MotionStagger, MotionItem, MotionCard } from "@/components/motion";

type Props = {
  courses: Course[];
};

export function CourseGrid({ courses }: Props) {
  const visible = courses.filter((course) => course.format === "online");
  const isSingle = visible.length === 1;

  return (
    <section id="courses" className="course-section py-16 sm:py-20">
      <div className="course-section-bg" aria-hidden="true" />
      <div className="shell relative z-[1]">
        <MotionFadeUp className="mb-10 max-w-3xl mx-auto text-center md:text-left md:mx-0">
          <div className="eyebrow">програми</div>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">Курси</h2>
          <p className="mt-3 text-left text-sm leading-relaxed text-cream-body">
            Навчайтесь у власному темпі. Після оплати курс відкривається у вашому кабінеті.
          </p>
        </MotionFadeUp>

        <MotionStagger
          className={`course-grid ${visible.length === 1 ? "course-grid-single" : ""}`}
        >
          {visible.map((course) => (
            <MotionItem key={course.id} className={isSingle ? "course-grid-item-spotlight" : undefined}>
              <CourseCard course={course} spotlight={isSingle} />
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

function CourseCard({ course, spotlight = false }: { course: Course; spotlight?: boolean }) {
  const imageUrl = resolveCourseImageUrl(course.image_url);

  return (
    <MotionCard
      className={`course-card ${course.featured ? "course-card-featured" : ""} ${spotlight ? "course-card-spotlight" : ""}`}
    >
      <div className="course-card-media">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={course.title}
            fill
            className="object-cover"
            sizes={spotlight ? "(max-width: 768px) 100vw, 480px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          />
        ) : (
          <div className="course-card-media-fallback" aria-hidden="true" />
        )}
        <div className="course-card-media-overlay" aria-hidden="true" />

        <div className="course-card-media-badges">
          {course.featured && (
            <span className="course-card-badge course-card-badge-featured">Популярний</span>
          )}
          {course.badge && (
            <span className="course-card-badge">{course.badge}</span>
          )}
          {isCourseOnSale(course) && (
            <span className="course-card-badge course-card-badge-sale">Акція</span>
          )}
        </div>

        <div className="course-card-price-tag">
          <CoursePrice course={course} />
        </div>
      </div>

      <div className="course-card-body">
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-desc">{course.description}</p>

        <ul className="course-card-features">
          {course.features.map((item) => (
            <li key={item} className="course-card-feature">
              <IconCheck className="course-card-feature-icon" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="course-card-footer">
        <CourseBuyButton slug={course.slug} />
        <span className="course-card-footer-hint">
          Доступ одразу після оплати
          <IconArrowRight className="inline-block h-3.5 w-3.5 opacity-60" />
        </span>
      </div>
    </MotionCard>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Course } from "@/lib/types";
import { IconCheck, IconArrowRight } from "@/components/icons";
import { CourseBuyButton } from "@/components/course-buy-button";
import { CoursePrice } from "@/components/course-price";
import { resolveCourseImageUrl } from "@/lib/images";
import { isCourseOnSale } from "@/lib/types";
import { MotionFadeUp, MotionStagger, MotionItem } from "@/components/motion";

type Props = {
  courses: Course[];
};

const ease = [0.22, 1, 0.36, 1] as const;

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
          <p className="mt-3 text-sm leading-relaxed text-cream-body md:text-left">
            Навчайтесь у власному темпі. Після оплати курс відкривається у вашому кабінеті.
          </p>
        </MotionFadeUp>

        <MotionStagger className={`course-grid ${isSingle ? "course-grid-single" : ""}`}>
          {visible.length === 0 ? (
            <div className="course-grid-empty card py-12 text-center">
              <p className="text-cream-body">Наразі немає опублікованих онлайн-курсів.</p>
              <p className="mt-2 text-sm text-muted">
                У адмінці увімкніть «Опубліковано» і формат «Онлайн» для вашого курсу.
              </p>
            </div>
          ) : (
            visible.map((course) => (
              <MotionItem key={course.id}>
                <CourseCard
                  course={course}
                  featured={isSingle || course.featured}
                  horizontal={isSingle}
                />
              </MotionItem>
            ))
          )}
        </MotionStagger>
      </div>
    </section>
  );
}

function CourseCard({
  course,
  featured,
  horizontal = false,
}: {
  course: Course;
  featured?: boolean;
  horizontal?: boolean;
}) {
  const imageUrl = resolveCourseImageUrl(course.image_url);
  const onSale = isCourseOnSale(course);

  return (
    <motion.div
      className={featured ? "course-showcase-wrap course-showcase-wrap-featured" : "course-showcase-wrap"}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease }}
    >
      <article className={`course-showcase ${horizontal ? "course-showcase-horizontal" : ""}`}>
        <div className="course-showcase-pattern" aria-hidden="true" />

        <div className="course-showcase-media">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 420px"
              priority={featured}
            />
          ) : (
            <div className="course-showcase-media-fallback" aria-hidden="true" />
          )}
          <div className="course-showcase-media-shade" aria-hidden="true" />
        </div>

        <div className="course-showcase-body">
          <div className="course-showcase-head">
            <div className="course-showcase-badges">
              {featured && (
                <span className="course-showcase-badge course-showcase-badge-popular">Популярний</span>
              )}
              {course.badge && <span className="course-showcase-badge">{course.badge}</span>}
              {onSale && (
                <span className="course-showcase-badge course-showcase-badge-sale">Акція</span>
              )}
            </div>

            <h3 className="course-showcase-title">{course.title}</h3>
            <p className="course-showcase-desc">{course.description}</p>
          </div>

          <div className="course-showcase-price">
            <CoursePrice course={course} size="lg" />
          </div>

          <ul className="course-showcase-features">
            {course.features.map((item) => (
              <li key={item} className="course-showcase-feature">
                <span className="course-showcase-feature-icon" aria-hidden="true">
                  <IconCheck />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="course-showcase-footer">
            <CourseBuyButton slug={course.slug} />
            <p className="course-showcase-hint">
              Доступ одразу після оплати
              <IconArrowRight className="h-3.5 w-3.5 opacity-50" />
            </p>
          </div>
        </div>
      </article>
    </motion.div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Course } from "@/lib/types";
import { IconCheck } from "@/components/icons";
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

        <MotionStagger className="course-grid">
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
                <CourseCard course={course} featured={course.featured} />
              </MotionItem>
            ))
          )}
        </MotionStagger>
      </div>
    </section>
  );
}

function CourseCard({ course, featured }: { course: Course; featured?: boolean }) {
  const imageUrl = resolveCourseImageUrl(course.image_url);
  const onSale = isCourseOnSale(course);

  return (
    <motion.div
      className={featured ? "course-card-wrap course-card-wrap-featured" : "course-card-wrap"}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22, ease }}
    >
      <article className="course-card">
        <div className="course-card-media">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={course.title}
              fill
              className="course-card-media-img"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
              priority={featured}
            />
          ) : (
            <div className="course-card-media-fallback" aria-hidden="true" />
          )}
          <div className="course-card-media-fade" aria-hidden="true" />

          <div className="course-card-badges">
            {featured && (
              <span className="course-card-badge course-card-badge-gold">Популярний</span>
            )}
            {course.badge && <span className="course-card-badge">{course.badge}</span>}
            {onSale && <span className="course-card-badge course-card-badge-sale">Акція</span>}
          </div>
        </div>

        <div className="course-card-body">
          <div className="course-card-top">
            <h3 className="course-card-title">{course.title}</h3>
            <p className="course-card-desc">{course.description}</p>
          </div>

          <div className="course-card-price-row">
            <CoursePrice course={course} size="lg" />
          </div>

          {course.features.length > 0 && (
            <ul className="course-card-features">
              {course.features.map((item) => (
                <li key={item} className="course-card-feature">
                  <IconCheck className="course-card-feature-icon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="course-card-footer">
            <div className="course-card-actions">
              <Link href={`/courses/${course.slug}`} className="btn btn-ghost">
                Деталі
              </Link>
              <CourseBuyButton course={course} />
            </div>
            <p className="course-card-hint">Доступ одразу після оплати</p>
          </div>
        </div>
      </article>
    </motion.div>
  );
}

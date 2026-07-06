"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { Course } from "@/lib/types";
import { getCourseHeroCopy, getCourseMarketing } from "@/content/course-marketing";
import { CourseBuyButton } from "@/components/course-buy-button";
import { CoursePrice } from "@/components/course-price";
import { IconArrowRight } from "@/components/icons";
import { MotionHeroLine } from "@/components/motion";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  course: Course;
  imageUrl?: string | null;
};

export function CourseDetailHero({ course, imageUrl }: Props) {
  const marketing = getCourseMarketing(course);
  const hero = getCourseHeroCopy(marketing);
  const reduced = useReducedMotion();
  const heroImage = imageUrl || course.image_url || "/images/hero-bg.jpg";

  return (
    <header className="course-hero">
      <div className="course-hero-bg" aria-hidden>
        <motion.div
          className="course-hero-bg-img-wrap"
          initial={reduced ? false : { scale: 1.04 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease }}
        >
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="course-hero-bg-img"
          />
        </motion.div>
        <div className="course-hero-bg-overlay" />
      </div>

      <div className="shell course-hero-inner">
        <div className="course-hero-copy">
          <MotionHeroLine as="h1" className="course-hero-title" delay={0.08}>
            {hero.headline}
          </MotionHeroLine>

          <MotionHeroLine as="p" className="course-hero-subtitle" delay={0.16}>
            {hero.subheadline}
          </MotionHeroLine>

          <motion.div
            className="course-hero-cta-row"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28, ease }}
          >
            <CourseBuyButton
              course={course}
              variant="sell"
              className="course-hero-cta"
              label={hero.ctaLabel}
              icon={<IconArrowRight className="h-4 w-4" />}
            />
            <div className="course-hero-price-wrap">
              <CoursePrice course={course} size="lg" />
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}

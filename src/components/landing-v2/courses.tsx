"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Award, Heart } from "lucide-react";
import { resolveCourseImageUrl } from "@/lib/images";
import { getCourseMarketing } from "@/content/course-marketing";
import {
  formatPrice,
  getEffectiveCoursePrice,
  isCourseOnSale,
  type Course,
} from "@/lib/types";
import { fadeUp, scaleIn, stagger, viewportOnce } from "./motion";

const gradients = [
  "from-[#F0DDD4] to-[#E7C7BC]",
  "from-[#EAD8CE] to-[#D9B9AC]",
  "from-[#F1E0D9] to-[#E2C3B7]",
];

function CourseCard({ course, index }: { course: Course; index: number }) {
  const imageUrl = resolveCourseImageUrl(course.image_url);
  const marketing = getCourseMarketing(course);
  const onSale = isCourseOnSale(course);
  const effective = getEffectiveCoursePrice(course);
  const gradient = gradients[index % gradients.length];

  return (
    <motion.article
      variants={scaleIn}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[var(--shadow-v2-card)] ring-1 ring-v2-ink/5"
    >
      <div className={`relative h-52 bg-gradient-to-br ${gradient}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.7),transparent_55%)]" />
        <div className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/70 text-v2-clay backdrop-blur">
          <Heart size={18} className="fill-v2-clay/20" />
        </div>
        {onSale && (
          <span className="absolute left-5 top-5 rounded-full bg-v2-clay px-3 py-1 text-xs font-semibold text-v2-cream">
            Акція
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-v2-display text-2xl font-semibold text-v2-ink">{course.title}</h3>
        <p className="mt-1 text-sm text-v2-mute">{marketing.tagline}</p>

        <div className="mt-5 flex items-center gap-5 text-sm text-v2-ink-soft">
          {course.features.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={15} className="text-v2-clay" /> {course.features.length} тем
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Award size={15} className="text-v2-clay" /> Сертифікат
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <p className="font-v2-display text-3xl font-semibold text-v2-ink">
            {onSale && (
              <span className="mr-2 align-middle text-base font-medium text-v2-mute line-through">
                {formatPrice(course.price_uah)}
              </span>
            )}
            {formatPrice(effective)}
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href={`/courses/${course.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-v2-clay py-3 pl-5 pr-4 text-sm font-semibold text-v2-cream shadow-[0_10px_25px_-8px_rgba(201,127,114,0.8)] transition-colors group-hover:bg-v2-clay-dark"
              aria-label={`Детальніше про курс ${course.title}`}
            >
              Деталі
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}

export function LandingV2Courses({ courses }: { courses: Course[] }) {
  const visible = courses.filter((course) => course.format === "online");

  return (
    <section id="courses" className="container-px py-20 sm:py-24">
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mb-10 flex items-end justify-between gap-4"
      >
        <motion.h2
          variants={fadeUp}
          className="font-v2-display text-4xl font-semibold text-v2-ink sm:text-5xl"
        >
          Популярні <span className="text-v2-clay">курси</span>
          <Heart size={20} className="ml-2 inline fill-v2-rose text-v2-rose" />
        </motion.h2>
      </motion.div>

      {visible.length === 0 ? (
        <div className="rounded-[1.75rem] bg-white p-12 text-center shadow-[var(--shadow-v2-card)] ring-1 ring-v2-ink/5">
          <p className="text-v2-ink-soft">Наразі немає опублікованих онлайн-курсів.</p>
        </div>
      ) : (
        <motion.div
          variants={stagger(0.14)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid gap-7 md:grid-cols-3"
        >
          {visible.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </motion.div>
      )}
    </section>
  );
}

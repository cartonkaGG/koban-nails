"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star, Heart } from "lucide-react";
import { fadeUp, scaleIn, stagger, viewportOnce } from "./motion";

const reviews = [
  {
    name: "Марина К.",
    initials: "МК",
    course: "Basic Start",
    text: "Галина — найкращий викладач! Все зрозуміло, доступно і дуже цікаво. Я нарешті наважилась і не пошкодувала!",
  },
  {
    name: "Оля С.",
    initials: "ОС",
    course: "Техніка та форма",
    text: "Після курсу «Техніка та форма» мої роботи стали значно якіснішими. Дуже дякую за детальну підтримку та відповіді.",
  },
  {
    name: "Катерина Л.",
    initials: "КЛ",
    course: "Дизайн та покриття",
    text: "Найкраще рішення — піти на курс до Галини. Дуже багато практики та корисної інформації, рекомендую всім!",
  },
];

export function LandingV2Reviews() {
  return (
    <section id="reviews" className="container-px py-20 sm:py-24">
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
          Відгуки учениць
          <Heart size={20} className="ml-2 inline fill-v2-rose text-v2-rose" />
        </motion.h2>
        <motion.a
          variants={fadeUp}
          href="#reviews"
          className="group hidden items-center gap-2 text-sm font-semibold text-v2-clay sm:inline-flex"
        >
          Дивитись більше
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </motion.a>
      </motion.div>

      <motion.div
        variants={stagger(0.14)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid gap-7 md:grid-cols-3"
      >
        {reviews.map((r) => (
          <motion.article
            key={r.name}
            variants={scaleIn}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="rounded-[1.75rem] bg-white p-7 shadow-[var(--shadow-v2-card)] ring-1 ring-v2-ink/5"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-v2-clay to-v2-clay-dark text-sm font-semibold text-v2-cream">
                {r.initials}
              </div>
              <div>
                <p className="font-semibold text-v2-ink">{r.name}</p>
                <div className="mt-0.5 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className="fill-v2-clay text-v2-clay" />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-v2-ink-soft">{r.text}</p>
            <p className="mt-5 inline-flex rounded-full bg-v2-sand px-3 py-1 text-xs font-medium text-v2-clay">
              Курс: {r.course}
            </p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

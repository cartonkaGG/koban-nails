"use client";

import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { fadeUp, stagger, viewportOnce } from "./motion";

export function LandingV2Cta() {
  return (
    <section className="container-px py-8 sm:py-12">
      <motion.div
        variants={stagger(0.12)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="relative overflow-hidden rounded-[2.5rem] bg-v2-ink px-8 py-16 text-center shadow-[var(--shadow-v2-soft)] sm:px-16"
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-v2-clay/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-v2-rose/20 blur-3xl" />

        <motion.span
          variants={fadeUp}
          className="relative text-xs font-semibold uppercase tracking-[0.35em] text-v2-rose"
        >
          Ваш новий старт
        </motion.span>
        <motion.h2
          variants={fadeUp}
          className="relative mx-auto mt-5 max-w-2xl font-v2-display text-4xl font-semibold text-v2-cream sm:text-5xl"
        >
          Готові змінити своє життя?
          <Heart size={24} className="ml-2 inline fill-v2-rose text-v2-rose" />
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="relative mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-v2-cream/70"
        >
          Приєднуйтесь до понад 100 учениць, які вже освоїли професію мрії.
          Оберіть свій курс сьогодні.
        </motion.p>
        <motion.a
          variants={fadeUp}
          href="#courses"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="group relative mt-9 inline-flex items-center gap-2 rounded-full bg-v2-cream px-8 py-4 text-sm font-semibold text-v2-ink"
        >
          Обрати курс
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </motion.a>
      </motion.div>
    </section>
  );
}

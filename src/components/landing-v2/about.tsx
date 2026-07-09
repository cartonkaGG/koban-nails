"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { fadeUp, stagger, viewportOnce, easeSoft } from "./motion";

export function LandingV2About() {
  return (
    <section id="about" className="container-px py-8 sm:py-12">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <motion.span
            variants={fadeUp}
            className="text-xs font-semibold uppercase tracking-[0.35em] text-v2-clay"
          >
            Про мене
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mt-4 font-v2-display text-4xl font-semibold text-v2-ink sm:text-5xl"
          >
            Привіт! Я Галина Кобан
            <Heart size={20} className="ml-2 inline fill-v2-rose text-v2-rose" />
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 max-w-lg leading-relaxed text-v2-mute">
            Інструктор базових онлайн- та офлайн-курсів з манікюру й педикюру, а
            також підвищення кваліфікації майстрів. Топ-майстер, спікер
            б&apos;юті-марафонів, помічник судді чемпіонату та багаторазова
            призерка чемпіонату України.
          </motion.p>
          <motion.p variants={fadeUp} className="mt-4 max-w-lg leading-relaxed text-v2-mute">
            Навчила понад 100 учениць. Моя мета — дати вам не просто теорію, а
            реальні навички, з якими ви впевнено почнете приймати клієнтів уже
            під час навчання.
          </motion.p>
          <motion.a
            variants={fadeUp}
            href="#courses"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-8 inline-flex rounded-full bg-v2-ink px-7 py-3.5 text-sm font-semibold text-v2-cream shadow-[var(--shadow-v2-soft)] transition-colors hover:bg-v2-ink-soft"
          >
            Більше про мене
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, ease: easeSoft }}
          className="relative"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-v2-beige shadow-[var(--shadow-v2-card)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/galyna-hero.png"
              alt="Робоче місце Галини Кобан"
              className="h-full w-full object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

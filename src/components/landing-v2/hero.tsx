"use client";

import { motion } from "framer-motion";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { fadeUp, stagger, easeSoft } from "./motion";

function FloatingHeart({
  className,
  delay = 0,
  size = 22,
}: {
  className?: string;
  delay?: number;
  size?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      <Heart size={size} className="fill-v2-rose text-v2-rose" />
    </motion.div>
  );
}

export function LandingV2Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-[72px]">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-v2-rose/20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-0 h-80 w-80 rounded-full bg-v2-clay/10 blur-3xl" />

      <div className="container-px relative grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <motion.div variants={stagger(0.14)} initial="hidden" animate="show">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-v2-ink/10 bg-white/60 px-4 py-1.5 text-sm text-v2-ink-soft"
          >
            Привіт! Я Галина Кобан
            <Heart size={14} className="fill-v2-rose text-v2-rose" />
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-6 font-v2-display text-5xl font-semibold leading-[1.05] text-v2-ink sm:text-6xl lg:text-7xl"
          >
            Навчу вас
            <br />
            <span className="relative">
              ідеальному
              <Sparkles className="absolute -right-8 -top-4 hidden text-v2-clay sm:block" size={26} />
            </span>
            <br />
            манікюру
            <span className="ml-3 inline-flex align-middle text-v2-rose">
              <Heart className="fill-v2-rose" size={30} />
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-v2-mute"
          >
            Понад 100 учениць уже змінили своє життя та почали заробляти
            улюбленою справою. Приєднуйтесь і ви.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
            <motion.a
              href="#courses"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-2 rounded-full bg-v2-ink px-7 py-3.5 text-sm font-semibold text-v2-cream shadow-[var(--shadow-v2-soft)] transition-colors hover:bg-v2-ink-soft"
            >
              Обрати курс
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </motion.a>
            <motion.a
              href="#about"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-full border border-v2-ink/15 bg-white/50 px-7 py-3.5 text-sm font-semibold text-v2-ink transition-colors hover:border-v2-clay hover:text-v2-clay"
            >
              Більше про мене
            </motion.a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.9, ease: easeSoft, delay: 0.15 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-[2.5rem] shadow-[var(--shadow-v2-soft)] ring-1 ring-white/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/galyna-hero.png"
              alt="Галина Кобан — майстер манікюру"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-v2-ink/15 via-transparent to-transparent" />
          </div>

          <FloatingHeart className="absolute -left-4 top-10" delay={0.4} size={26} />
          <FloatingHeart className="absolute -right-3 top-1/2" delay={0.9} size={18} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: easeSoft }}
            className="absolute -bottom-5 left-6 flex items-center gap-3 rounded-2xl bg-white/90 px-5 py-3 shadow-[var(--shadow-v2-card)] backdrop-blur"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-v2-clay/15 text-v2-clay">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-v2-ink">6+ років</p>
              <p className="text-xs text-v2-mute">досвіду в манікюрі</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

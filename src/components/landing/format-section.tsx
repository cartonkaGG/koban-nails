"use client";

import { motion } from "framer-motion";
import { MotionFadeUp } from "@/components/motion";

const STEPS = [
  {
    title: "Теорія без зайвого",
    description: "Матеріали, інструменти, стерилізація простими словами.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7h8M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Відпрацювання техніки",
    description: "Чистий зріз, рівне покриття, безпечна робота.",
    featured: true,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l2.4 4.8L20 8l-4 3.9.9 5.5L12 15.8 7.1 17.4 8 11.9 4 8l5.6-1.2L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Готовність до клієнтів",
    description: "Алгоритм роботи, портфоліо і впевненість у діях.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingFormatSection() {
  return (
    <section id="format" className="format-section">
      <div className="format-section-bg" aria-hidden="true" />
      <div className="shell relative z-[1]">
        <div className="format-section-grid">
          <MotionFadeUp className="format-intro">
            <p className="eyebrow">навчання</p>
            <h2 className="format-intro-title">
              Від першого руху до <span className="text-gold">готової роботи</span>
            </h2>
            <p className="format-intro-desc">
              Теорія, практика і зворотний зв&apos;язок. Онлайн-уроки доступні 24/7 у кабінеті після
              оплати.
            </p>
            <div className="format-intro-line" aria-hidden="true" />
          </MotionFadeUp>

          <ul className="format-steps">
            {STEPS.map((step, index) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ duration: 0.75, delay: index * 0.1, ease }}
                className={
                  "featured" in step && step.featured
                    ? "format-step-wrap format-step-wrap-featured"
                    : "format-step-wrap"
                }
              >
                <article className="format-step-card">
                  <div className="format-step-icon">{step.icon}</div>
                  <div className="format-step-num">{String(index + 1).padStart(2, "0")}</div>
                  <h3 className="format-step-title">{step.title}</h3>
                  <p className="format-step-desc">{step.description}</p>
                </article>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

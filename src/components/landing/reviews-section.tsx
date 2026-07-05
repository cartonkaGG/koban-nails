"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote:
      "Після Online я нарешті зрозуміла послідовність і перестала боятися перших клієнтів.",
    context: "Курс Online",
  },
  {
    quote:
      "Онлайн-формат зручний: дивлюсь уроки ввечері, а куратор коментує мої роботи.",
    context: "Курс Online",
  },
  {
    quote: "Pro допоміг прибрати зайві рухи — стала швидше і чистіше працювати.",
    context: "Курс Pro",
  },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingReviewsSection() {
  return (
    <section id="reviews" className="reviews-section">
      <div className="shell">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.9, ease }}
          className="reviews-header"
        >
          <p className="eyebrow">відгуки</p>
          <h2 className="reviews-title">
            Після курсу — <span className="text-gold">реальні результати</span>
          </h2>
        </motion.div>

        <ul className="reviews-grid">
          {TESTIMONIALS.map((item, index) => (
            <motion.li
              key={item.quote}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.8, delay: index * 0.08, ease }}
              className="reviews-card"
            >
              <span className="reviews-quote-mark" aria-hidden="true">
                &ldquo;
              </span>
              <p className="reviews-quote">{item.quote}</p>
              <div className="reviews-card-footer">
                <p className="reviews-context">{item.context}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

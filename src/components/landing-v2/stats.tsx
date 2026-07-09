"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "./motion";

const stats = [
  { value: 6, suffix: "+", label: "років досвіду" },
  { value: 100, suffix: "+", label: "учениць" },
  { value: 20, suffix: "+", label: "курсів" },
  { value: 24, suffix: "/7", label: "підтримка" },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function LandingV2Stats() {
  return (
    <section className="container-px">
      <motion.div
        variants={stagger(0.12)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid grid-cols-2 gap-6 rounded-[2rem] bg-v2-sand px-8 py-10 shadow-[0_20px_50px_-30px_rgba(90,70,55,0.4)] sm:grid-cols-4 sm:gap-4"
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            className={`text-center ${
              i !== stats.length - 1 ? "sm:border-r sm:border-v2-ink/10" : ""
            }`}
          >
            <p className="font-v2-display text-4xl font-semibold text-v2-ink sm:text-5xl">
              <Counter value={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-1 text-sm text-v2-mute">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { MonitorPlay, Award, ClipboardCheck, Headphones } from "lucide-react";
import { fadeUp, stagger, viewportOnce } from "./motion";

const features = [
  {
    icon: MonitorPlay,
    title: "Доступ назавжди",
    text: "Навчайся у зручний для себе час",
  },
  {
    icon: Award,
    title: "Сертифікат",
    text: "Після завершення курсу ти отримаєш сертифікат",
  },
  {
    icon: ClipboardCheck,
    title: "Практичні завдання",
    text: "Закріплюй знання на практиці",
  },
  {
    icon: Headphones,
    title: "Підтримка 24/7",
    text: "Ми завжди поруч і готові допомогти",
  },
];

export function LandingV2Features() {
  return (
    <section className="container-px py-16 sm:py-20">
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid gap-6 rounded-[2rem] bg-v2-sand p-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            className="group flex flex-col items-center text-center"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-v2-clay shadow-[0_12px_30px_-16px_rgba(201,127,114,0.7)]"
            >
              <f.icon size={26} strokeWidth={1.6} />
            </motion.div>
            <h3 className="mt-4 font-semibold text-v2-ink">{f.title}</h3>
            <p className="mt-1.5 max-w-[200px] text-sm text-v2-mute">{f.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

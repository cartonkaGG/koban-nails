"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Mail, Phone } from "lucide-react";
import { fadeUp, stagger, viewportOnce } from "./motion";

const INSTAGRAM_URL = "https://www.instagram.com/koban_nails/";

const navColumn = {
  title: "Навігація",
  links: [
    { label: "Курси", href: "#courses" },
    { label: "Про мене", href: "#about" },
    { label: "Відгуки", href: "#reviews" },
  ],
};

const docsColumn = {
  title: "Документи",
  links: [
    { label: "Публічна оферта", href: "/offer" },
    { label: "Політика конфіденційності", href: "/privacy" },
    { label: "Повернення коштів", href: "/refund" },
  ],
};

export function LandingV2Footer() {
  return (
    <footer id="footer" className="mt-10 bg-v2-ink text-v2-cream">
      <div className="container-px py-16">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2">
              <span className="font-v2-display text-2xl font-semibold tracking-[0.25em]">
                KOBAN
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.35em] text-v2-rose">
                nails
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-v2-cream/60">
              Навчання ідеальному манікюру з Галиною Кобан. Ваша нова професія
              починається тут.
            </p>
            <div className="mt-6 flex gap-3">
              <motion.a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Koban Nails"
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="grid h-11 w-11 place-items-center rounded-full bg-v2-cream/10 text-v2-cream transition-colors hover:bg-v2-clay"
              >
                <Camera size={18} />
              </motion.a>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-v2-cream/50">
              {navColumn.title}
            </h4>
            <ul className="mt-4 space-y-3">
              {navColumn.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-v2-cream/80 transition-colors hover:text-v2-rose"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-v2-cream/50">
              {docsColumn.title}
            </h4>
            <ul className="mt-4 space-y-3">
              {docsColumn.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-v2-cream/80 transition-colors hover:text-v2-rose"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-v2-cream/50">
              Контакти
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-v2-cream/80">
              <li>Кобан Галина Андріївна</li>
              <li>
                <a
                  href="mailto:galakoban@gmail.com"
                  className="inline-flex items-center gap-2 transition-colors hover:text-v2-rose"
                >
                  <Mail size={15} />
                  galakoban@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+380668438015"
                  className="inline-flex items-center gap-2 transition-colors hover:text-v2-rose"
                >
                  <Phone size={15} />
                  +380 66 843 80 15
                </a>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-v2-rose"
                >
                  <Camera size={15} />
                  @koban_nails
                </a>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-v2-cream/10 pt-6 text-xs text-v2-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Koban Nails. Всі права захищені.</p>
          <div className="flex flex-wrap gap-6">
            <Link href="/privacy" className="transition-colors hover:text-v2-cream">
              Політика конфіденційності
            </Link>
            <Link href="/offer" className="transition-colors hover:text-v2-cream">
              Публічна оферта
            </Link>
            <Link href="/refund" className="transition-colors hover:text-v2-cream">
              Повернення коштів
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

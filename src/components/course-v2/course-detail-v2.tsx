"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  ShieldCheck,
  Award,
  Clock,
  CreditCard,
  Heart,
  Sparkles,
  Scissors,
  Fingerprint,
  Palette,
  Camera,
} from "lucide-react";
import { CourseBuyButton } from "@/components/course-buy-button";
import { OfferCountdown } from "@/components/course/offer-countdown";
import { CourseStickyCtaV2 } from "@/components/course-v2/course-sticky-cta-v2";
import {
  formatPrice,
  getEffectiveCoursePrice,
  isCourseOnSale,
  isOfferCountdownEnabled,
  type Course,
} from "@/lib/types";
import { getCourseHeroCopy, getCourseMarketing } from "@/content/course-marketing";
import { resolveCourseImageUrl } from "@/lib/images";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const stagger = (delay = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
});

const viewportOnce = { once: true, amount: 0.25 } as const;

const learnIcons = [Scissors, Fingerprint, Palette, Sparkles, Camera, Award];

type ProgramItem = { title: string; body: string };

function parseProgram(course: Course, fallback: ProgramItem[]): ProgramItem[] {
  const text = course.detailed_description?.trim();
  if (!text) return fallback;

  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return fallback;

  return blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const [first, ...rest] = lines;
    const title = first.replace(/^[-•\d.\s]+/, "").trim() || first;
    return { title, body: rest.join(" ") };
  });
}

function ProgramAccordion({ items }: { items: ProgramItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={`${item.title}-${i}`}
            className="overflow-hidden rounded-2xl bg-white ring-1 ring-v2-ink/8 shadow-[var(--shadow-v2-soft)]"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-v2-display text-lg font-semibold text-v2-clay">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm font-semibold text-v2-ink sm:text-base">
                {item.title}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-v2-mute transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && item.body && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 pl-[3.75rem] text-sm leading-relaxed text-v2-mute">
                    {item.body}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

type Props = {
  course: Course;
  imageUrl?: string | null;
};

export function CourseDetailV2({ course, imageUrl }: Props) {
  const marketing = getCourseMarketing(course);
  const hero = getCourseHeroCopy(marketing);
  const onSale = isCourseOnSale(course);
  const effective = getEffectiveCoursePrice(course);
  const showCountdown = isOfferCountdownEnabled(course);
  const ctaLabel = onSale ? hero.ctaLabel : "Отримати доступ";
  const heroImage = imageUrl || resolveCourseImageUrl(course.image_url) || "/galyna-hero.png";
  const badge = course.badge || (course.featured ? "Найпопулярніший курс" : marketing.tagline);

  const checklist = [
    course.features.length > 0
      ? `${course.features.length} уроків`
      : "Покрокова програма",
    "Сертифікат після курсу",
    "Підтримка куратора 24/7",
    course.format === "online" ? "Доступ назавжди" : "Практика на моделях",
  ];

  const learnItems =
    course.features.length > 0
      ? course.features.slice(0, 6)
      : marketing.forYouIf.slice(0, 5).map((f) => f.title);

  const programItems = parseProgram(
    course,
    marketing.reasons.map((r) => ({ title: r.title, body: r.text })),
  );

  return (
    <main className="course-v2 bg-v2-cream pb-28 pt-[72px] text-v2-ink md:pb-0">
      {/* HERO */}
      <section className="container-px pt-6 sm:pt-10">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-v2-mute sm:text-sm">
          <Link href="/" className="transition-colors hover:text-v2-clay">
            Головна
          </Link>
          <span>›</span>
          <Link href="/#courses" className="transition-colors hover:text-v2-clay">
            Курси
          </Link>
          <span>›</span>
          <span className="text-v2-ink-soft">{course.title}</span>
        </nav>

        <div className="mt-6 grid items-center gap-8 lg:mt-10 lg:grid-cols-2 lg:gap-12">
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            animate="show"
            className="order-1 lg:order-1"
          >
            {badge && (
              <motion.span
                variants={fadeUp}
                className="inline-flex rounded-full bg-v2-clay/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-v2-clay"
              >
                {badge}
              </motion.span>
            )}
            <motion.h1
              variants={fadeUp}
              className="mt-3 font-v2-display text-[2rem] font-semibold leading-[1.08] text-v2-ink sm:mt-5 sm:text-5xl sm:leading-[1.05] lg:text-6xl"
            >
              {course.title}
            </motion.h1>

            <motion.div variants={fadeUp} className="mt-4 sm:mt-6 md:mt-8">
              <div className="mb-3 flex flex-wrap items-baseline gap-2">
                {onSale && (
                  <span className="text-base font-medium text-v2-mute line-through">
                    {formatPrice(course.price_uah)}
                  </span>
                )}
                <span className="font-v2-display text-3xl font-semibold text-v2-ink sm:text-4xl">
                  {formatPrice(effective)}
                </span>
                {onSale && (
                  <span className="rounded-full bg-v2-clay/12 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-v2-clay">
                    Акція
                  </span>
                )}
              </div>
              {showCountdown && onSale && (
                <div className="mb-4">
                  <OfferCountdown scope={course.slug} variant="compact" />
                </div>
              )}
              <CourseBuyButton
                course={course}
                variant="v2"
                label={ctaLabel}
                icon={<span className="sr-only" />}
                className="inline-flex w-full items-center justify-center rounded-full bg-v2-clay px-8 py-4 text-base font-semibold text-v2-cream shadow-[0_16px_36px_-14px_rgba(201,127,114,0.9)] transition-colors hover:bg-v2-clay-dark disabled:opacity-60 sm:w-auto"
              />
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mt-5 font-v2-display text-2xl font-medium text-v2-ink-soft sm:mt-4 sm:text-3xl"
            >
              {hero.headline}
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-lg text-base leading-relaxed text-v2-mute"
            >
              {course.description}
            </motion.p>

            <motion.ul variants={fadeUp} className="mt-6 space-y-3">
              {checklist.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-v2-ink-soft sm:text-base">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-v2-clay/12 text-v2-clay">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </motion.ul>

            <motion.p
              variants={fadeUp}
              className="mt-4 inline-flex items-center gap-2 text-xs text-v2-mute sm:text-sm"
            >
              <ShieldCheck size={16} className="text-v2-clay" />
              Без ризиків. Повернення протягом 14 днів
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease }}
            className="order-2 lg:order-2"
          >
            <div className="relative aspect-[4/3] max-h-[min(52vw,280px)] overflow-hidden rounded-[2rem] bg-gradient-to-br from-v2-beige to-[#dcc7ba] shadow-[var(--shadow-v2-card)] sm:max-h-none sm:aspect-[4/4] lg:aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt={course.title} className="h-full w-full object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHAT YOU'LL LEARN */}
      <section className="container-px py-16 sm:py-20">
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <motion.div variants={fadeUp} className="text-center">
            <Heart size={22} className="mx-auto fill-v2-rose text-v2-rose" />
            <h2 className="mt-3 font-v2-display text-3xl font-semibold text-v2-ink sm:text-4xl">
              Що ви навчитесь
            </h2>
          </motion.div>

          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {learnItems.map((item, i) => {
              const Icon = learnIcons[i % learnIcons.length];
              return (
                <motion.div
                  key={`${item}-${i}`}
                  variants={fadeUp}
                  className="flex flex-col items-center text-center"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-v2-clay shadow-[var(--shadow-v2-soft)] ring-1 ring-v2-ink/8">
                    <Icon size={24} />
                  </span>
                  <p className="mt-3 text-sm font-medium leading-snug text-v2-ink-soft">
                    {item}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* PROGRAM */}
      <section className="container-px pb-16 sm:pb-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.div
            variants={stagger(0.06)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.h2
              variants={fadeUp}
              className="mb-6 font-v2-display text-3xl font-semibold text-v2-ink sm:text-4xl"
            >
              Програма курсу
            </motion.h2>
            <motion.div variants={fadeUp}>
              <ProgramAccordion items={programItems} />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, ease }}
            className="hidden lg:block"
          >
            <div className="sticky top-24 aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-v2-beige to-[#dcc7ba] shadow-[var(--shadow-v2-card)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt={course.title} className="h-full w-full object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container-px pb-20 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease }}
          className="rounded-[2rem] bg-white px-6 py-12 text-center shadow-[var(--shadow-v2-card)] ring-1 ring-v2-ink/8 sm:px-12 sm:py-16"
        >
          <h2 className="mx-auto max-w-2xl font-v2-display text-3xl font-semibold leading-tight text-v2-ink sm:text-4xl">
            Почніть свій шлях до професії мрії вже сьогодні
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-v2-mute">
            Приєднуйтесь до понад 100 учениць та створіть красу, яка надихає.
          </p>

          <div className="mt-8">
            <p className="mb-4 font-v2-display text-3xl font-semibold text-v2-ink">
              {onSale && (
                <span className="mr-2 text-lg font-medium text-v2-mute line-through">
                  {formatPrice(course.price_uah)}
                </span>
              )}
              {formatPrice(effective)}
            </p>
            <CourseBuyButton
              course={course}
              variant="v2"
              label={ctaLabel}
              icon={<span className="sr-only" />}
              className="inline-flex w-full items-center justify-center rounded-full bg-v2-clay px-8 py-4 text-base font-semibold text-v2-cream shadow-[0_16px_36px_-14px_rgba(201,127,114,0.9)] transition-colors hover:bg-v2-clay-dark disabled:opacity-60 sm:w-auto"
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-v2-ink-soft">
            <span className="inline-flex items-center gap-2">
              <CreditCard size={16} className="text-v2-clay" /> Оплата онлайн
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles size={16} className="text-v2-clay" /> Доступ одразу після оплати
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock size={16} className="text-v2-clay" /> Підтримка 24/7
            </span>
          </div>
        </motion.div>
      </section>

      <CourseStickyCtaV2 course={course} ctaLabel={ctaLabel} />
    </main>
  );
}

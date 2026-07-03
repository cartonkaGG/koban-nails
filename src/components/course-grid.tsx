"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Course } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import { IconArrowRight, IconCheck } from "@/components/icons";

type Props = {
  courses: Course[];
};

export function CourseGrid({ courses }: Props) {
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const visible = courses.filter((c) => filter === "all" || c.format === filter);

  return (
    <section id="courses" className="py-16 sm:py-20">
      <div className="shell">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="eyebrow">програми</div>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">Курси</h2>
          </div>
          <div className="max-w-xl">
            <p className="text-sm leading-relaxed text-cream-body">
              Оберіть формат під свій графік. Після оплати онлайн-курс відкривається у вашому кабінеті.
            </p>
            <div className="mt-4 inline-flex rounded-lg border border-line p-1" role="tablist" aria-label="Формат курсу">
              {[
                ["all", "Усі"],
                ["online", "Онлайн"],
                ["offline", "Офлайн"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    filter === key ? "bg-gold text-black" : "text-cream-body hover:text-cream"
                  }`}
                  onClick={() => setFilter(key as typeof filter)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((course) => (
            <article
              key={course.id}
              className={`card relative overflow-hidden ${course.featured ? "border-gold/40 ring-1 ring-gold/20" : ""}`}
            >
              {course.featured && (
                <span className="absolute right-4 top-4 z-10 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-black">
                  Популярний
                </span>
              )}
              <div className="relative -mx-5 -mt-5 mb-4 aspect-[16/10] overflow-hidden">
                {course.image_url && (
                  <Image
                    src={course.image_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
              </div>
              {course.badge && <span className="badge">{course.badge}</span>}
              <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl">{course.title}</h3>
              <p className="mt-2 text-sm text-cream-body">{course.description}</p>
              <ul className="mt-4 space-y-2">
                {course.features.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-cream-body">
                    <IconCheck className="mt-0.5 shrink-0 text-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-xl font-bold text-gold">{formatPrice(course.price_uah)}</span>
                <Link href={`/checkout/${course.slug}`} className="btn btn-primary">
                  Купити
                  <IconArrowRight />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

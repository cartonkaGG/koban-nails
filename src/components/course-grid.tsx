"use client";

import Image from "next/image";
import type { Course } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import { IconCheck } from "@/components/icons";
import { CourseBuyButton } from "@/components/course-buy-button";

type Props = {
  courses: Course[];
  isLoggedIn?: boolean;
};

export function CourseGrid({ courses, isLoggedIn = false }: Props) {
  const visible = courses.filter((course) => course.format === "online");

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
              Навчайтесь у власному темпі. Після оплати курс відкривається у вашому кабінеті.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((course) => (
            <article
              key={course.id}
              className={`card relative overflow-hidden ${course.featured ? "border-gold/40 ring-1 ring-gold/20" : ""}`}
            >
              {course.featured && (
                <span className="absolute left-5 top-5 z-10 inline-flex w-fit rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-black shadow-lg shadow-black/30">
                  Популярний
                </span>
              )}
              {course.image_url && (
                <div className="-mx-5 -mt-5 mb-4 overflow-hidden rounded-t-xl border-b border-line bg-black/30">
                  <Image
                    src={course.image_url}
                    alt={course.title}
                    width={720}
                    height={450}
                    className="block h-auto w-full"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}
              {course.badge && <span className="badge">{course.badge}</span>}
              <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl">{course.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream-body">{course.description}</p>
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
                <CourseBuyButton slug={course.slug} isLoggedIn={isLoggedIn} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

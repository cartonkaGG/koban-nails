"use client";

import { CourseBuyButton } from "@/components/course-buy-button";
import { OfferCountdown } from "@/components/course/offer-countdown";
import {
  formatPrice,
  getEffectiveCoursePrice,
  isCourseOnSale,
  isOfferCountdownEnabled,
  type Course,
} from "@/lib/types";

type Props = {
  course: Course;
  ctaLabel?: string;
};

export function CourseStickyCtaV2({ course, ctaLabel = "Отримати доступ" }: Props) {
  const onSale = isCourseOnSale(course);
  const effective = getEffectiveCoursePrice(course);
  const showCountdown = isOfferCountdownEnabled(course);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[120] border-t border-v2-clay/20 bg-v2-cream/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md md:hidden"
      role="region"
      aria-label="Швидке оформлення доступу"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            {onSale && (
              <span className="text-sm text-v2-mute line-through">
                {formatPrice(course.price_uah)}
              </span>
            )}
            <span className="font-v2-display text-xl font-semibold text-v2-ink">
              {formatPrice(effective)}
            </span>
          </div>
          {showCountdown && (
            <OfferCountdown
              scope={course.slug}
              variant="compact"
              className="mt-0.5"
            />
          )}
        </div>
        <CourseBuyButton
          course={course}
          variant="v2"
          label={ctaLabel}
          icon={<></>}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-v2-clay px-5 py-3 text-sm font-semibold text-v2-cream shadow-[0_10px_25px_-8px_rgba(201,127,114,0.8)] transition-colors hover:bg-v2-clay-dark disabled:opacity-60"
        />
      </div>
    </div>
  );
}

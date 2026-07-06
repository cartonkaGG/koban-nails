"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";

type Variant = "hero" | "card" | "inline" | "panel" | "compact" | "display";

type Props = {
  scope: string;
  variant?: Variant;
  className?: string;
  label?: string;
};

export function OfferCountdown({
  scope,
  variant = "inline",
  className = "",
  label = "Спеціальна ціна закінчиться через",
}: Props) {
  const { parts, ready } = useOfferCountdown(scope);
  const reduced = useReducedMotion();

  if (!ready || !parts) {
    return (
      <div className={`offer-countdown offer-countdown-${variant} ${className}`.trim()} aria-hidden="true">
        <div className="offer-countdown-skeleton-grid">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  const units = [
    { value: parts.hours, label: "год" },
    { value: parts.minutes, label: "хв" },
    { value: parts.seconds, label: "сек" },
  ];

  const grid = (
    <div className="offer-countdown-grid" aria-live="polite">
      {units.map((unit) => (
        <div key={unit.label} className="offer-countdown-cell">
          <span className="offer-countdown-value">{String(unit.value).padStart(2, "0")}</span>
          <span className="offer-countdown-label">{unit.label}</span>
        </div>
      ))}
    </div>
  );

  const digits = (
    <div className="offer-countdown-inline-digits" aria-live="polite">
      {units.map((unit, index) => (
        <span key={unit.label} className="offer-countdown-inline-unit">
          {String(unit.value).padStart(2, "0")}
          {index < units.length - 1 && <span className="offer-countdown-inline-sep">:</span>}
        </span>
      ))}
    </div>
  );

  if (variant === "card") {
    return (
      <div className={`offer-countdown offer-countdown-card ${className}`.trim()}>
        <p className="offer-countdown-eyebrow">Знижка зникає через</p>
        {grid}
      </div>
    );
  }

  if (variant === "display") {
    return (
      <div className={`offer-countdown offer-countdown-display ${className}`.trim()}>
        <p className="offer-countdown-display-label">{label}</p>
        {digits}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`offer-countdown offer-countdown-compact ${className}`.trim()}>
        <p className="offer-countdown-compact-label">{label}</p>
        {digits}
      </div>
    );
  }

  if (variant === "panel" || variant === "hero") {
    return (
      <motion.div
        className={`offer-countdown offer-countdown-${variant} ${className}`.trim()}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: variant === "hero" ? 0.15 : 0 }}
      >
        <div className="offer-countdown-hero-top">
          <span className="offer-countdown-pulse" aria-hidden="true" />
          <p className="offer-countdown-eyebrow">{label}</p>
        </div>
        {grid}
      </motion.div>
    );
  }

  return (
    <div className={`offer-countdown offer-countdown-inline ${className}`.trim()}>
      {digits}
    </div>
  );
}

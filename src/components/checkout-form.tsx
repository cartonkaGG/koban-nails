"use client";

import Link from "next/link";
import { useState } from "react";
import { CoursePrice } from "@/components/course-price";
import { PaymentRedirectOverlay } from "@/components/payment-redirect-overlay";
import type { Course } from "@/lib/types";
import { useAuthModal } from "@/components/auth/auth-modal-context";

type LiqPayCheckout = {
  url: string;
  data: string;
  signature: string;
};

type Props = {
  course: Course;
  onClose?: () => void;
  compact?: boolean;
};

export function CheckoutForm({ course, onClose, compact = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liqpay, setLiqpay] = useState<LiqPayCheckout | null>(null);
  const { openAuth } = useAuthModal();

  async function buy() {
    setLoading(true);
    setError("");
    let redirecting = false;

    try {
      const res = await fetch(`/api/enroll/${course.slug}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          openAuth({ mode: "login", next: `/checkout/${course.slug}` });
          return;
        }
        setError(data.error ?? "Помилка оформлення");
        return;
      }

      if (data.liqpay?.url && data.liqpay?.data && data.liqpay?.signature) {
        redirecting = true;
        setLiqpay(data.liqpay as LiqPayCheckout);
        return;
      }

      if (data.redirect?.startsWith("http")) {
        window.location.href = data.redirect;
        return;
      }

      if (data.pending && data.message) {
        window.location.href = `${data.redirect ?? "/cabinet"}?pending=1`;
        return;
      }

      window.location.href = data.redirect ?? "/cabinet";
    } finally {
      if (!redirecting) {
        setLoading(false);
      }
    }
  }

  if (liqpay) {
    return (
      <PaymentRedirectOverlay
        url={liqpay.url}
        data={liqpay.data}
        signature={liqpay.signature}
      />
    );
  }

  return (
    <div className={compact ? "space-y-5" : "card space-y-5"}>
      <div>
        <p className="eyebrow">оформлення</p>
        <h1
          id="checkout-modal-title"
          className="mt-2 font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl"
        >
          {course.title}
        </h1>
        <p className="mt-2 text-sm text-cream-body">{course.description}</p>
      </div>
      <div className="rounded-xl border border-line bg-black/30 p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">До сплати</span>
          <CoursePrice course={course} size="lg" />
        </div>
      </div>
      <p className="text-sm text-cream-body">
        Після оплати курс відкриється у вашому кабінеті з уроками та прогресом.
      </p>
      <p className="text-xs leading-relaxed text-muted">
        Натискаючи «Підтвердити покупку», ви погоджуєтесь з{" "}
        <Link href="/offer" className="text-gold hover:underline" onClick={onClose}>
          публічною офертою
        </Link>
        ,{" "}
        <Link href="/privacy" className="text-gold hover:underline" onClick={onClose}>
          політикою конфіденційності
        </Link>{" "}
        та{" "}
        <Link href="/refund" className="text-gold hover:underline" onClick={onClose}>
          політикою повернення коштів
        </Link>
        .
      </p>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={buy} disabled={loading}>
          {loading ? "Обробка..." : "Підтвердити покупку"}
        </button>
        {onClose ? (
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Скасувати
          </button>
        ) : (
          <Link href="/#courses" className="btn btn-ghost">
            Назад до курсів
          </Link>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { CoursePrice } from "@/components/course-price";
import { PaymentRedirectOverlay } from "@/components/payment-redirect-overlay";
import type { Course } from "@/lib/types";
import { isAllowedPaymentUrl } from "@/lib/security/payment-url";
import { getSafeRedirectPath } from "@/lib/security/redirect";
import { useAuthModal } from "@/components/auth/auth-modal-context";

type LiqPayCheckout = {
  url: string;
  data: string;
  signature: string;
};

type Props = {
  course: Course;
  onClose?: () => void;
};

export function CheckoutForm({ course, onClose }: Props) {
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

      if (typeof data.redirect === "string" && data.redirect.startsWith("http")) {
        if (!isAllowedPaymentUrl(data.redirect)) {
          setError("Недійсне посилання для оплати. Зверніться до підтримки.");
          return;
        }
        window.location.href = data.redirect;
        return;
      }

      const safeRedirect = getSafeRedirectPath(data.redirect);

      if (data.pending && data.message) {
        window.location.href = `${safeRedirect}?pending=1`;
        return;
      }

      window.location.href = safeRedirect;
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
    <div className="space-y-5">
      <div>
        <p className="v2-eyebrow">оформлення</p>
        <h1
          id="checkout-modal-title"
          className="v2-modal-title mt-2 text-2xl sm:text-3xl"
        >
          {course.title}
        </h1>
        <p className="v2-modal-subtitle mt-2">{course.description}</p>
      </div>
      <div className="rounded-2xl border border-[rgba(46,42,38,0.08)] bg-v2-sand p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-v2-mute">До сплати</span>
          <CoursePrice course={course} size="lg" />
        </div>
      </div>
      <p className="text-sm text-v2-ink-soft">
        Після оплати курс відкриється у вашому кабінеті з уроками та прогресом.
      </p>
      <p className="text-xs leading-relaxed text-v2-mute">
        Натискаючи «Підтвердити покупку», ви погоджуєтесь з{" "}
        <Link href="/offer" className="v2-modal-link" onClick={onClose}>
          публічною офертою
        </Link>
        ,{" "}
        <Link href="/privacy" className="v2-modal-link" onClick={onClose}>
          політикою конфіденційності
        </Link>{" "}
        та{" "}
        <Link href="/refund" className="v2-modal-link" onClick={onClose}>
          політикою повернення коштів
        </Link>
        .
      </p>
      {error && <p className="v2-alert-error">{error}</p>}
      <div className="flex flex-col gap-3">
        <button type="button" className="v2-btn-primary" onClick={buy} disabled={loading}>
          {loading ? "Обробка..." : "Підтвердити покупку"}
        </button>
        {onClose ? (
          <button type="button" className="v2-btn-ghost" onClick={onClose} disabled={loading}>
            Скасувати
          </button>
        ) : (
          <Link href="/#courses" className="v2-btn-ghost">
            Назад до курсів
          </Link>
        )}
      </div>
    </div>
  );
}

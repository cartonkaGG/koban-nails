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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [liqpay, setLiqpay] = useState<LiqPayCheckout | null>(null);
  const { openAuth } = useAuthModal();

  async function buy() {
    if (!acceptedTerms) {
      setError("Щоб продовжити оплату, погодьтесь з умовами оферти та політиками сайту.");
      return;
    }

    setLoading(true);
    setError("");
    let redirecting = false;

    try {
      const res = await fetch(`/api/enroll/${course.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptTerms: true }),
      });
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
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-v2-mute">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-[#C97F72]"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          required
        />
        <span>
          Я погоджуюсь з{" "}
          <Link
            href="/offer"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-v2-clay underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            публічною офертою
          </Link>
          ,{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-v2-clay underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            політикою конфіденційності
          </Link>{" "}
          та{" "}
          <Link
            href="/refund"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-v2-clay underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            політикою повернення коштів
          </Link>
          .
        </span>
      </label>
      {error && <p className="v2-alert-error">{error}</p>}
      <div className="flex flex-col gap-3">
        <button type="button" className="v2-btn-primary" onClick={buy} disabled={loading || !acceptedTerms}>
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

"use client";

import Link from "next/link";
import { useState } from "react";
import { CoursePrice } from "@/components/course-price";
import { LiqPayCheckoutRedirect } from "@/components/liqpay-checkout-redirect";
import type { Course } from "@/lib/types";
import { useAuthModal } from "@/components/auth/auth-modal-context";

type LiqPayCheckout = {
  url: string;
  data: string;
  signature: string;
};

export function CheckoutForm({ course }: { course: Course }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liqpay, setLiqpay] = useState<LiqPayCheckout | null>(null);
  const { openAuth } = useAuthModal();

  async function buy() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/enroll/${course.slug}`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 401) {
        openAuth({ mode: "login", next: `/checkout/${course.slug}` });
        return;
      }
      setError(data.error ?? "Помилка оформлення");
      return;
    }

    if (data.liqpay?.url && data.liqpay?.data && data.liqpay?.signature) {
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
  }

  if (liqpay) {
    return (
      <div className="card space-y-4 py-10 text-center">
        <p className="text-sm text-cream-body">Перенаправляємо на безпечну сторінку оплати LiqPay…</p>
        <LiqPayCheckoutRedirect url={liqpay.url} data={liqpay.data} signature={liqpay.signature} />
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      <div>
        <p className="eyebrow">оформлення</p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl">{course.title}</h1>
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
        <Link href="/offer" className="text-gold hover:underline">
          публічною офертою
        </Link>
        ,{" "}
        <Link href="/privacy" className="text-gold hover:underline">
          політикою конфіденційності
        </Link>{" "}
        та{" "}
        <Link href="/refund" className="text-gold hover:underline">
          політикою повернення коштів
        </Link>
        .
      </p>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={buy} disabled={loading}>
          {loading ? "Обробка..." : "Підтвердити покупку"}
        </button>
        <Link href="/#courses" className="btn btn-ghost">Назад до курсів</Link>
      </div>
    </div>
  );
}

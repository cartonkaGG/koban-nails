"use client";

import Link from "next/link";
import { useState } from "react";
import type { Course } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import { useAuthModal } from "@/components/auth/auth-modal-context";

export function CheckoutForm({ course }: { course: Course }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

    if (data.redirect?.startsWith("http")) {
      window.location.href = data.redirect;
      return;
    }

    window.location.href = data.redirect ?? "/cabinet";
  }

  return (
    <div className="card space-y-5">
      <div>
        <p className="eyebrow">оформлення</p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl">{course.title}</h1>
        <p className="mt-2 text-sm text-cream-body">{course.description}</p>
      </div>
      <div className="rounded-xl border border-line bg-black/30 p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted">До сплати</span>
          <span className="text-2xl font-bold text-gold">{formatPrice(course.price_uah)}</span>
        </div>
      </div>
      <p className="text-sm text-cream-body">
        Після оплати курс відкриється у вашому кабінеті з уроками та прогресом.
      </p>
      <p className="text-xs leading-relaxed text-muted">
        Натискаючи «Підтвердити покупку», ви погоджуєтесь з{" "}
        <Link href="/terms" className="text-gold hover:underline">
          умовами використання
        </Link>{" "}
        та{" "}
        <Link href="/privacy" className="text-gold hover:underline">
          політикою конфіденційності
        </Link>
        . Цифрові продукти (онлайн-курси) поверненню не підлягають.
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

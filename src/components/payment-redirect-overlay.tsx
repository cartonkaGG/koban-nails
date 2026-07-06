"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LiqPayCheckoutRedirect } from "@/components/liqpay-checkout-redirect";

type Props = {
  url: string;
  data: string;
  signature: string;
};

export function PaymentRedirectOverlay({ url, data, signature }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="payment-overlay-root" role="dialog" aria-modal="true" aria-live="polite">
      <div className="payment-overlay-panel">
        <div className="payment-overlay-icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="payment-overlay-title">Підтвердження оплати</p>
        <p className="payment-overlay-text">Перенаправляємо на безпечну сторінку LiqPay…</p>
        <div className="payment-overlay-spinner" aria-hidden="true" />
        <LiqPayCheckoutRedirect url={url} data={data} signature={signature} />
      </div>
    </div>,
    document.body,
  );
}

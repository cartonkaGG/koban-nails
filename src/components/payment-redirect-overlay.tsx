"use client";

import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  url: string;
  data: string;
  signature: string;
};

export function PaymentRedirectOverlay({ url, data, signature }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useLayoutEffect(() => {
    document.body.classList.add("payment-overlay-open");

    if (!submittedRef.current) {
      submittedRef.current = true;
      formRef.current?.submit();
    }

    return () => {
      document.body.classList.remove("payment-overlay-open");
    };
  }, [url, data, signature]);

  return createPortal(
    <div className="payment-overlay-root" role="alertdialog" aria-modal="true" aria-busy="true">
      <div className="payment-overlay-panel">
        <div className="payment-overlay-spinner" aria-hidden="true" />
        <p className="payment-overlay-title">Перехід до оплати</p>
        <p className="payment-overlay-text">Зачекайте, відкриваємо безпечну сторінку LiqPay…</p>

        <form ref={formRef} method="POST" action={url} className="payment-overlay-form">
          <input type="hidden" name="data" value={data} />
          <input type="hidden" name="signature" value={signature} />
          <button type="submit" className="payment-overlay-fallback">
            Натисніть тут, якщо сторінка не відкрилась
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}

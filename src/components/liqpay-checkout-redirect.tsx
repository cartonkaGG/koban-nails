"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  url: string;
  data: string;
  signature: string;
};

export function LiqPayCheckoutRedirect({ url, data, signature }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);

    const fallbackTimer = window.setTimeout(() => setShowFallback(true), 2500);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className="space-y-4">
      <form ref={formRef} method="POST" action={url}>
        <input type="hidden" name="data" value={data} />
        <input type="hidden" name="signature" value={signature} />
        {showFallback && (
          <button type="submit" className="btn btn-primary">
            Перейти до оплати LiqPay
          </button>
        )}
      </form>
      {showFallback && (
        <p className="text-xs text-muted">
          Якщо перенаправлення не відбулось автоматично, натисніть кнопку вище.
        </p>
      )}
    </div>
  );
}

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
    }, 100);

    const fallbackTimer = window.setTimeout(() => setShowFallback(true), 3000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallbackTimer);
    };
  }, [url, data, signature]);

  return (
    <div className="payment-overlay-form">
      <form ref={formRef} method="POST" action={url} target="_self">
        <input type="hidden" name="data" value={data} />
        <input type="hidden" name="signature" value={signature} />
        {showFallback && (
          <button type="submit" className="btn btn-primary mt-4 w-full">
            Перейти до оплати LiqPay
          </button>
        )}
      </form>
    </div>
  );
}

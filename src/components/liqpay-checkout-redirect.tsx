"use client";

import { useEffect, useRef } from "react";

type Props = {
  url: string;
  data: string;
  signature: string;
};

export function LiqPayCheckoutRedirect({ url, data, signature }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <form ref={formRef} method="POST" action={url} className="hidden" aria-hidden="true">
      <input type="hidden" name="data" value={data} />
      <input type="hidden" name="signature" value={signature} />
    </form>
  );
}

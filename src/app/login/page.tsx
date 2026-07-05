"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LoginRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") ?? "/cabinet";
    router.replace(`/?auth=login&next=${encodeURIComponent(next)}`);
  }, [router, searchParams]);

  return null;
}

export default function LoginRedirect() {
  return (
    <Suspense fallback={null}>
      <LoginRedirectInner />
    </Suspense>
  );
}

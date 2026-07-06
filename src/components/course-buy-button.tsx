"use client";

import { useState } from "react";
import { CheckoutModal } from "@/components/checkout-modal";
import { useAuthModal } from "@/components/auth/auth-modal-context";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Course } from "@/lib/types";
import { IconArrowRight } from "@/components/icons";

type Props = {
  course: Course;
};

async function isUserLoggedIn() {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  }

  const res = await fetch("/api/auth/session", { cache: "no-store" });
  if (!res.ok) return false;
  const data = (await res.json()) as { loggedIn?: boolean };
  return Boolean(data.loggedIn);
}

export function CourseBuyButton({ course }: Props) {
  const { openAuth } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const checkoutPath = `/checkout/${course.slug}`;

  async function handleBuy() {
    setLoading(true);
    try {
      const loggedIn = await isUserLoggedIn();
      if (!loggedIn) {
        openAuth({ mode: "login", next: checkoutPath });
        return;
      }
      setCheckoutOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={handleBuy} disabled={loading}>
        {loading ? "Зачекайте..." : "Купити"}
        {!loading && <IconArrowRight />}
      </button>
      <CheckoutModal course={course} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}

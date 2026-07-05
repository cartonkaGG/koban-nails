"use client";

import { useState } from "react";
import { useAuthModal } from "@/components/auth/auth-modal-context";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { IconArrowRight } from "@/components/icons";

type Props = {
  slug: string;
};

async function isUserLoggedIn() {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return Boolean(user);
  }

  const res = await fetch("/api/auth/session", { cache: "no-store" });
  if (!res.ok) return false;
  const data = (await res.json()) as { loggedIn?: boolean };
  return Boolean(data.loggedIn);
}

export function CourseBuyButton({ slug }: Props) {
  const { openAuth } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const checkoutPath = `/checkout/${slug}`;

  async function handleBuy() {
    setLoading(true);
    try {
      const loggedIn = await isUserLoggedIn();
      if (!loggedIn) {
        openAuth({ mode: "login", next: checkoutPath });
        return;
      }
      window.location.assign(checkoutPath);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className="btn btn-primary" onClick={handleBuy} disabled={loading}>
      {loading ? "Зачекайте..." : "Купити"}
      {!loading && <IconArrowRight />}
    </button>
  );
}

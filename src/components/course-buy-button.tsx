"use client";

import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/auth/auth-modal-context";
import { IconArrowRight } from "@/components/icons";

type Props = {
  slug: string;
  isLoggedIn: boolean;
};

export function CourseBuyButton({ slug, isLoggedIn }: Props) {
  const router = useRouter();
  const { openAuth } = useAuthModal();
  const checkoutPath = `/checkout/${slug}`;

  function handleBuy() {
    if (!isLoggedIn) {
      openAuth({ mode: "login", next: checkoutPath });
      return;
    }
    router.push(checkoutPath);
  }

  return (
    <button type="button" className="btn btn-primary" onClick={handleBuy}>
      Купити
      <IconArrowRight />
    </button>
  );
}

"use client";

import { useEffect } from "react";
import { IconClose } from "@/components/icons";
import { CheckoutForm } from "@/components/checkout-form";
import type { Course } from "@/lib/types";

type Props = {
  course: Course | null;
  open: boolean;
  onClose: () => void;
};

export function CheckoutModal({ course, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("checkout-modal-open");
    return () => document.body.classList.remove("checkout-modal-open");
  }, [open]);

  if (!open || !course) return null;

  return (
    <div className="checkout-modal-root" role="presentation">
      <button type="button" className="checkout-modal-backdrop" aria-label="Закрити" onClick={onClose} />
      <div
        className="checkout-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
      >
        <button type="button" className="checkout-modal-close" aria-label="Закрити" onClick={onClose}>
          <IconClose width={18} height={18} />
        </button>
        <CheckoutForm course={course} onClose={onClose} compact />
      </div>
    </div>
  );
}

"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useAuthModal } from "./auth-modal-context";

type Props = Omit<ComponentPropsWithoutRef<"button">, "onClick"> & {
  mode?: "login" | "register";
  next?: string;
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function AuthTrigger({ mode = "login", next, children, className, onClick, ...props }: Props) {
  const { openAuth } = useAuthModal();

  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        onClick?.(event);
        openAuth({ mode, next });
      }}
      {...props}
    >
      {children}
    </button>
  );
}

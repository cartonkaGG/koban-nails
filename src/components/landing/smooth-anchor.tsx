"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<"a">, "href"> & {
  id: string;
};

export function SmoothAnchor({ id, onClick, children, ...props }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();

    if (pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
      return;
    }

    router.push(`/#${id}`);
  }

  return (
    <a href={`#${id}`} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

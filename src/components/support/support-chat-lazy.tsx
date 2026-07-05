"use client";

import dynamic from "next/dynamic";

const SupportChat = dynamic(
  () => import("@/components/support/support-chat").then((m) => m.SupportChat),
  { ssr: false },
);

export function SupportChatLazy() {
  return <SupportChat />;
}

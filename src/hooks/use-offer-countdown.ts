"use client";

import { useEffect, useState } from "react";
import { formatCountdownMs, getOfferRemainingMs, type CountdownParts } from "@/lib/offer-countdown";

export function useOfferCountdown(scope: string) {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    function tick() {
      setParts(formatCountdownMs(getOfferRemainingMs(scope)));
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [scope]);

  return { parts, ready: parts !== null };
}

const CYCLE_MS = 3 * 60 * 60 * 1000;

export type CountdownParts = {
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatCountdownMs(ms: number): CountdownParts {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return {
    hours,
    minutes,
    seconds,
    label: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  };
}

export function getStorageKey(scope = "default") {
  return `koban_offer_end_${scope}`;
}

/** Personal cyclic deadline: 3h per visitor, resets when expired. */
export function readOfferDeadline(scope = "default"): number {
  if (typeof window === "undefined") {
    return Date.now() + CYCLE_MS;
  }

  const key = getStorageKey(scope);
  const now = Date.now();
  let end = Number.parseInt(window.localStorage.getItem(key) ?? "", 10);

  if (!Number.isFinite(end) || end <= now) {
    end = now + CYCLE_MS;
    window.localStorage.setItem(key, String(end));
  }

  return end;
}

export function getOfferRemainingMs(scope = "default"): number {
  return Math.max(0, readOfferDeadline(scope) - Date.now());
}

export const OFFER_CYCLE_HOURS = 3;

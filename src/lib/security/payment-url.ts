const DEFAULT_PAYMENT_HOSTS = ["liqpay.ua", "www.liqpay.ua", "liqpay.com", "www.liqpay.com"];

function getAllowedPaymentHosts(): string[] {
  const fromEnv = process.env.PAYMENT_URL_ALLOWED_HOSTS?.split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv?.length ? fromEnv : DEFAULT_PAYMENT_HOSTS;
}

/** Allow only HTTPS payment URLs on an explicit host allowlist. */
export function validatePaymentUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase();
  const allowed = getAllowedPaymentHosts();
  if (!allowed.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`))) {
    return null;
  }

  return parsed.toString();
}

export function isAllowedPaymentUrl(value: string): boolean {
  return validatePaymentUrl(value) !== null;
}

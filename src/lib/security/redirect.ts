const DEFAULT_REDIRECT = "/cabinet";

/** Reject open redirects: only same-origin relative paths. */
export function getSafeRedirectPath(value: unknown, fallback = DEFAULT_REDIRECT): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\") || trimmed.includes("@")) return fallback;
  if (/%2f%2f/i.test(trimmed) || /%5c/i.test(trimmed)) return fallback;
  if (!/^\/[a-zA-Z0-9/_\-.?=&%]*$/.test(trimmed)) return fallback;
  return trimmed;
}

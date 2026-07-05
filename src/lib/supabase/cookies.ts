const ONE_YEAR = 60 * 60 * 24 * 400;

export function applyAuthCookieDefaults(options?: Record<string, unknown>) {
  const maxAge =
    typeof options?.maxAge === "number" && options.maxAge > 0
      ? options.maxAge
      : ONE_YEAR;

  return {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    ...options,
    maxAge,
  };
}

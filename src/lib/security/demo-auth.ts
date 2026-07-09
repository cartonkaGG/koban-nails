/** Demo cookie auth is disabled in production unless explicitly opted in. */
export function isDemoAuthAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const flag = process.env.ALLOW_DEMO_AUTH?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

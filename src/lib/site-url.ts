export function getSiteOrigin(request?: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (request) return new URL(request.url).origin;
  return "http://localhost:3000";
}

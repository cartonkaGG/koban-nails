const DEFAULT_PRODUCTION_ORIGIN = "https://koban-nails.beauty";

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/$/, "");
}

function isLocalOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Canonical public site URL for emails and auth redirects. */
export function getSiteOrigin(_request?: Request) {
  const siteUrl = process.env.SITE_URL?.trim();
  if (siteUrl) return normalizeOrigin(siteUrl);

  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (process.env.VERCEL_ENV === "production") {
    if (publicUrl && !isLocalOrigin(publicUrl)) return normalizeOrigin(publicUrl);
    return DEFAULT_PRODUCTION_ORIGIN;
  }

  if (publicUrl) return normalizeOrigin(publicUrl);

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

/** Fix Supabase verify links that still point redirect_to to localhost. */
export function fixAuthActionLink(actionLink: string, origin = getSiteOrigin()) {
  try {
    const url = new URL(actionLink);
    const redirectTo = url.searchParams.get("redirect_to");

    if (!redirectTo) return actionLink;

    const redirectUrl = new URL(redirectTo);
    if (!isLocalOrigin(redirectUrl.origin)) return actionLink;

    const fixedRedirect = new URL(
      `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`,
      origin,
    );
    url.searchParams.set("redirect_to", fixedRedirect.toString());
    return url.toString();
  } catch {
    return actionLink;
  }
}

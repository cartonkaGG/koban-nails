import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isDemoAuthAllowed } from "@/lib/security/demo-auth";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  if (!isDemoAuthAllowed()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const ip = getClientIp(request);
  const limited = rateLimit({ key: `demo-login:${ip}`, limit: 10, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { role } = await request.json();
  const store = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  store.set("koban_demo_user", role === "admin" ? "admin" : "student", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  if (!isDemoAuthAllowed()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const store = await cookies();
  store.delete("koban_demo_user");
  return NextResponse.json({ ok: true });
}

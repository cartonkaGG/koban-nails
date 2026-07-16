import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limited = rateLimit({ key: `reset-password:${ip}`, limit: 10, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;

  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Пароль має містити щонайменше 6 символів." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Сесія відновлення закінчилась. Запросіть новий лист для зміни пароля." },
      { status: 401 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, redirectTo: "/cabinet" });
}

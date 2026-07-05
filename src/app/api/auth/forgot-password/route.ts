import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/emails/send";
import { renderResetPasswordEmail } from "@/lib/emails/templates";
import { getSiteOrigin } from "@/lib/site-url";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { isResendConfigured } from "@/lib/resend/config";

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 400 });
  }

  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: "Email service is not configured. Contact support." },
      { status: 503 },
    );
  }

  const { email } = await request.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const origin = getSiteOrigin(request);
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent("/cabinet/profile")}`;

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: normalizedEmail,
    options: { redirectTo: callbackUrl },
  });

  if (linkError || !linkData.properties?.action_link) {
    return NextResponse.json({
      ok: true,
      message: "Якщо акаунт існує, ми надіслали лист для зміни пароля.",
    });
  }

  const firstName =
    (linkData.user?.user_metadata?.first_name as string | undefined) ??
    (linkData.user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    "";

  const template = renderResetPasswordEmail({
    firstName,
    resetUrl: linkData.properties.action_link,
  });

  await sendEmail({
    to: normalizedEmail,
    subject: template.subject,
    html: template.html,
  });

  return NextResponse.json({
    ok: true,
    message: "Якщо акаунт існує, ми надіслали лист для зміни пароля.",
  });
}

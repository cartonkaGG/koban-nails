import { Resend } from "resend";
import { getResendApiKey, getResendFromEmail, isResendConfigured } from "@/lib/resend/config";

let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(getResendApiKey());
  }
  return resendClient;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!isResendConfigured()) {
    console.warn("[email] Resend is not configured — skipping send to", params.to);
    return { ok: false as const, skipped: true as const };
  }

  const { error } = await getResendClient().emails.send({
    from: getResendFromEmail(),
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

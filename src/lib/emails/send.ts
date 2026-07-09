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
  text?: string;
  replyTo?: string;
}) {
  if (!isResendConfigured()) {
    console.warn("[email] Resend is not configured — skipping send to", params.to);
    return { ok: false as const, skipped: true as const, error: "Resend API key is missing" };
  }

  const from = getResendFromEmail();

  const { data, error } = await getResendClient().emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo ?? "hello@koban-nails.beauty",
  });

  if (error) {
    console.error("[email] Resend error:", { from, to: params.to, error });
    return { ok: false as const, error: error.message };
  }

  if (!data?.id) {
    console.error("[email] Resend returned no message id:", { from, to: params.to, data });
    return { ok: false as const, error: "Resend не повернув id листа." };
  }

  console.info("[email] Sent:", { id: data.id, to: params.to, from });
  return { ok: true as const, id: data.id };
}

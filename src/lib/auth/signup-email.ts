import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/emails/send";
import { renderConfirmEmailEmail } from "@/lib/emails/templates";
import { fixAuthActionLink, getSiteOrigin } from "@/lib/site-url";

type Params = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  fullName: string;
  redirectTo: string;
  origin: string;
  deleteUnconfirmed?: boolean;
};

export async function sendSignupConfirmationEmail(params: Params) {
  const supabase = await createAdminClient();
  const callbackUrl = `${params.origin}/auth/callback?next=${encodeURIComponent(params.redirectTo)}`;

  if (params.deleteUnconfirmed) {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return { ok: false as const, error: listError.message };
    }

    const existingUser = users.users.find(
      (user) => user.email?.toLowerCase() === params.email.toLowerCase(),
    );

    if (existingUser?.email_confirmed_at) {
      return { ok: false as const, error: "Акаунт вже підтверджений. Увійдіть." };
    }

    if (existingUser && !existingUser.email_confirmed_at) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        return { ok: false as const, error: deleteError.message };
      }
    }
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "signup",
    email: params.email,
    password: params.password,
    options: {
      redirectTo: callbackUrl,
      data: {
        first_name: params.firstName,
        last_name: params.lastName,
        full_name: params.fullName,
      },
    },
  });

  if (linkError) {
    console.error("[signup-email] Supabase generateLink:", linkError.message);
    return { ok: false as const, error: linkError.message };
  }

  const rawConfirmUrl = linkData.properties?.action_link;
  if (!rawConfirmUrl) {
    return { ok: false as const, error: "Не вдалося створити посилання підтвердження." };
  }

  const confirmUrl = fixAuthActionLink(rawConfirmUrl, params.origin);

  const template = renderConfirmEmailEmail({
    firstName: params.firstName,
    confirmUrl,
  });

  const sent = await sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
  });

  if (!sent.ok) {
    return {
      ok: false as const,
      error: sent.error ?? "Не вдалося надіслати лист. Перевірте Resend і домен koban-nails.beauty.",
    };
  }

  return { ok: true as const, emailId: sent.id };
}

export function getSignupOrigin(request?: Request) {
  return getSiteOrigin(request);
}

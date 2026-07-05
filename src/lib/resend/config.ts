export function getResendApiKey() {
  return process.env.RESEND_API_KEY?.trim() ?? "";
}

export function getResendFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ??
    "Koban nails <onboarding@resend.dev>"
  );
}

export function isResendConfigured() {
  return getResendApiKey().startsWith("re_");
}

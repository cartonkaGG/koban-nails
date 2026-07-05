export function getResendApiKey() {
  return process.env.RESEND_API_KEY?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function getResendFromEmail() {
  const raw =
    process.env.RESEND_FROM_EMAIL?.trim().replace(/^["']|["']$/g, "") ??
    "Koban nails <hello@koban-nails.beauty>";
  return raw;
}

export function isResendConfigured() {
  return getResendApiKey().startsWith("re_");
}

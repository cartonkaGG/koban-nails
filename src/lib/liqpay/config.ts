export function isLiqPayConfigured() {
  return Boolean(getLiqPayPublicKey() && getLiqPayPrivateKey());
}

/**
 * Sandbox is explicit opt-in only.
 * On Vercel production deploys, LIQPAY_SANDBOX is ignored unless
 * LIQPAY_ALLOW_SANDBOX_IN_PRODUCTION=1 — so leftover test flags cannot
 * keep charging in test mode after real keys are connected.
 */
export function isLiqPaySandbox() {
  const flag = process.env.LIQPAY_SANDBOX?.trim().toLowerCase();
  const wantsSandbox = flag === "1" || flag === "true";
  if (!wantsSandbox) return false;

  const isVercelProduction = process.env.VERCEL_ENV === "production";
  const allowOnProduction =
    process.env.LIQPAY_ALLOW_SANDBOX_IN_PRODUCTION === "1" ||
    process.env.LIQPAY_ALLOW_SANDBOX_IN_PRODUCTION === "true";

  if (isVercelProduction && !allowOnProduction) {
    console.warn(
      "[liqpay] LIQPAY_SANDBOX is set but ignored on production. Remove it in Vercel or set LIQPAY_ALLOW_SANDBOX_IN_PRODUCTION=1 for intentional test charges.",
    );
    return false;
  }

  return true;
}

export function getLiqPayPublicKey() {
  return process.env.LIQPAY_PUBLIC_KEY?.trim() ?? "";
}

export function getLiqPayPrivateKey() {
  return process.env.LIQPAY_PRIVATE_KEY?.trim() ?? "";
}

/** True when the configured public key looks like LiqPay sandbox credentials. */
export function isLiqPaySandboxKeyConfigured() {
  return getLiqPayPublicKey().toLowerCase().startsWith("sandbox_");
}

export const LIQPAY_CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";

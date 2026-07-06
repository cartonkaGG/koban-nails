export function isLiqPayConfigured() {
  return Boolean(getLiqPayPublicKey() && getLiqPayPrivateKey());
}

export function isLiqPaySandbox() {
  return process.env.LIQPAY_SANDBOX === "1" || process.env.LIQPAY_SANDBOX === "true";
}

export function getLiqPayPublicKey() {
  return process.env.LIQPAY_PUBLIC_KEY?.trim() ?? "";
}

export function getLiqPayPrivateKey() {
  return process.env.LIQPAY_PRIVATE_KEY?.trim() ?? "";
}

export const LIQPAY_CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";

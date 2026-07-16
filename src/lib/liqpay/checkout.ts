import { getSiteOrigin } from "@/lib/site-url";
import {
  getLiqPayPublicKey,
  isLiqPaySandbox,
  LIQPAY_CHECKOUT_URL,
} from "@/lib/liqpay/config";
import { encodeLiqPayData, signLiqPayPayload } from "@/lib/liqpay/crypto";

/** Where LiqPay sends the buyer after payment (Мої курси). */
export const LIQPAY_RESULT_PATH = "/cabinet?payment=success";

function liqPayAbsoluteUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteOrigin()}${normalized}`;
}

type BuildCheckoutInput = {
  orderId: string;
  amountUah: number;
  description: string;
  privateKey: string;
};

export function buildLiqPayCheckout(input: BuildCheckoutInput) {
  const publicKey = getLiqPayPublicKey();
  const params: Record<string, unknown> = {
    public_key: publicKey,
    version: 3,
    action: "pay",
    amount: Number(input.amountUah.toFixed(2)),
    currency: "UAH",
    description: input.description.slice(0, 255),
    order_id: input.orderId,
    result_url: liqPayAbsoluteUrl(LIQPAY_RESULT_PATH),
    server_url: liqPayAbsoluteUrl("/api/payments/liqpay/callback"),
  };

  if (isLiqPaySandbox()) {
    params.sandbox = 1;
  }

  // Hard safety: never send sandbox=1 with non-sandbox keys mixed accidentally.
  // LiqPay sandbox keys are prefixed with "sandbox_".
  const keyLooksSandbox = publicKey.toLowerCase().startsWith("sandbox_");
  if (params.sandbox === 1 && !keyLooksSandbox) {
    console.warn(
      "[liqpay] sandbox flag dropped because LIQPAY_PUBLIC_KEY is not a sandbox_ key",
    );
    delete params.sandbox;
  }
  if (!params.sandbox && keyLooksSandbox) {
    console.warn(
      "[liqpay] public key looks like sandbox_, but LIQPAY_SANDBOX is off — payments may fail or stay in test merchant",
    );
  }

  const data = encodeLiqPayData(params);
  const signature = signLiqPayPayload(data, input.privateKey);

  return {
    url: LIQPAY_CHECKOUT_URL,
    data,
    signature,
  };
}

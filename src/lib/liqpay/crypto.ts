import { createHash, timingSafeEqual } from "crypto";

/** LiqPay signature: base64(sha1(private_key + data + private_key)). */
export function signLiqPayPayload(data: string, privateKey: string) {
  return createHash("sha1")
    .update(privateKey + data + privateKey, "utf8")
    .digest("base64");
}

export function verifyLiqPaySignature(data: string, signature: string, privateKey: string) {
  if (!data || !signature || !privateKey) return false;

  const expected = signLiqPayPayload(data, privateKey);
  const received = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");

  if (received.length !== computed.length) return false;
  return timingSafeEqual(received, computed);
}

export function encodeLiqPayData(params: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(params), "utf8").toString("base64");
}

export function decodeLiqPayData<T extends Record<string, unknown>>(data: string): T | null {
  try {
    const json = Buffer.from(data, "base64").toString("utf8");
    const parsed = JSON.parse(json) as T;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

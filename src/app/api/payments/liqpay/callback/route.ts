import { NextResponse } from "next/server";
import { activateEnrollment } from "@/lib/enrollments";
import { getLiqPayPrivateKey, getLiqPayPublicKey } from "@/lib/liqpay/config";
import { decodeLiqPayData, verifyLiqPaySignature } from "@/lib/liqpay/crypto";
import {
  getPaymentByOrderId,
  isLiqPaySuccessStatus,
  liqPayAmountMatches,
  mapLiqPayStatus,
  markPaymentFromLiqPay,
} from "@/lib/payments";
import { notifyPurchase } from "@/lib/telegram/send";
import { getCourseById } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

type LiqPayCallbackPayload = {
  order_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  public_key?: string;
  payment_id?: number;
  err_description?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const privateKey = getLiqPayPrivateKey();
  const publicKey = getLiqPayPublicKey();
  if (!privateKey || !publicKey) {
    return NextResponse.json({ error: "LiqPay is not configured" }, { status: 503 });
  }

  const form = await request.formData();
  const data = String(form.get("data") ?? "");
  const signature = String(form.get("signature") ?? "");

  if (!verifyLiqPaySignature(data, signature, privateKey)) {
    console.error("LiqPay callback: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const payload = decodeLiqPayData<LiqPayCallbackPayload>(data);
  if (!payload?.order_id || !payload.status) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (payload.public_key && payload.public_key !== publicKey) {
    console.error("LiqPay callback: public_key mismatch");
    return NextResponse.json({ error: "Invalid public key" }, { status: 403 });
  }

  const payment = await getPaymentByOrderId(payload.order_id);
  if (!payment) {
    console.error("LiqPay callback: unknown order", payload.order_id);
    return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  }

  if (payload.currency && payload.currency !== "UAH") {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }

  if (!liqPayAmountMatches(payload.amount, payment.amount_uah)) {
    console.error("LiqPay callback: amount mismatch", {
      orderId: payment.order_id,
      expected: payment.amount_uah,
      received: payload.amount,
    });
    await markPaymentFromLiqPay({
      orderId: payment.order_id,
      status: "failure",
      liqpayStatus: payload.status,
      liqpayPaymentId: payload.payment_id ?? null,
      liqpayRaw: { ...payload, _reject_reason: "amount_mismatch" },
    });
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const mappedStatus = mapLiqPayStatus(payload.status);

  if (payment.status === "success") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { payment: updated, error } = await markPaymentFromLiqPay({
    orderId: payment.order_id,
    status: mappedStatus,
    liqpayStatus: payload.status,
    liqpayPaymentId: payload.payment_id ?? null,
    liqpayRaw: payload as Record<string, unknown>,
  });

  if (error || !updated) {
    return NextResponse.json({ error: error ?? "Update failed" }, { status: 500 });
  }

  if (!isLiqPaySuccessStatus(payload.status)) {
    return NextResponse.json({ ok: true, status: mappedStatus });
  }

  const { error: enrollError } = await activateEnrollment(payment.user_id, payment.course_id);
  if (enrollError) {
    console.error("LiqPay callback: enrollment activation failed", enrollError);
    return NextResponse.json({ error: "Enrollment failed" }, { status: 500 });
  }

  const admin = await createAdminClient();
  const [{ data: profile }, course] = await Promise.all([
    admin.from("profiles").select("email, full_name").eq("id", payment.user_id).maybeSingle(),
    getCourseById(payment.course_id),
  ]);

  if (profile && course) {
    await notifyPurchase({
      userName: profile.full_name ?? profile.email,
      email: profile.email,
      courseTitle: course.title,
      priceUah: payment.amount_uah,
    });
  }

  return NextResponse.json({ ok: true, status: "success" });
}

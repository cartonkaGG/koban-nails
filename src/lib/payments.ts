import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export type PaymentStatus = "pending" | "success" | "failure" | "reversed";

export type PaymentRecord = {
  id: string;
  order_id: string;
  user_id: string;
  course_id: string;
  amount_uah: number;
  currency: string;
  status: PaymentStatus;
  liqpay_payment_id: number | null;
  liqpay_status: string | null;
  liqpay_raw: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapPayment(row: Record<string, unknown>): PaymentRecord {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    user_id: String(row.user_id),
    course_id: String(row.course_id),
    amount_uah: Number(row.amount_uah),
    currency: String(row.currency ?? "UAH"),
    status: row.status as PaymentStatus,
    liqpay_payment_id:
      row.liqpay_payment_id == null ? null : Number(row.liqpay_payment_id),
    liqpay_status: (row.liqpay_status as string | null) ?? null,
    liqpay_raw: (row.liqpay_raw as Record<string, unknown> | null) ?? null,
    paid_at: (row.paid_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function createCoursePayment(input: {
  userId: string;
  courseId: string;
  amountUah: number;
}) {
  if (!isSupabaseAdminConfigured()) {
    return { payment: null, error: "Admin client is not configured" };
  }

  const admin = await createAdminClient();
  const orderId = crypto.randomUUID();

  const { data, error } = await admin
    .from("payments")
    .insert({
      order_id: orderId,
      user_id: input.userId,
      course_id: input.courseId,
      amount_uah: input.amountUah,
      currency: "UAH",
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    return { payment: null, error: error?.message ?? "Failed to create payment" };
  }

  return { payment: mapPayment(data as Record<string, unknown>), error: null };
}

export async function getPaymentByOrderId(orderId: string) {
  if (!isSupabaseAdminConfigured()) return null;

  const admin = await createAdminClient();
  const { data } = await admin
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  return data ? mapPayment(data as Record<string, unknown>) : null;
}

export async function markPaymentFromLiqPay(input: {
  orderId: string;
  status: PaymentStatus;
  liqpayStatus: string;
  liqpayPaymentId?: number | null;
  liqpayRaw: Record<string, unknown>;
}) {
  if (!isSupabaseAdminConfigured()) {
    return { payment: null, error: "Admin client is not configured" };
  }

  const admin = await createAdminClient();
  const paidAt = input.status === "success" ? new Date().toISOString() : null;

  const { data, error } = await admin
    .from("payments")
    .update({
      status: input.status,
      liqpay_status: input.liqpayStatus,
      liqpay_payment_id: input.liqpayPaymentId ?? null,
      liqpay_raw: input.liqpayRaw,
      paid_at: paidAt,
    })
    .eq("order_id", input.orderId)
    .select("*")
    .single();

  if (error || !data) {
    return { payment: null, error: error?.message ?? "Failed to update payment" };
  }

  return { payment: mapPayment(data as Record<string, unknown>), error: null };
}

/** Compare LiqPay callback amount (decimal UAH) with stored integer UAH. */
export function liqPayAmountMatches(amountFromGateway: unknown, amountUah: number) {
  const parsed = Number(amountFromGateway);
  if (!Number.isFinite(parsed) || parsed <= 0) return false;
  return Math.round(parsed * 100) === Math.round(amountUah * 100);
}

export function mapLiqPayStatus(status: string): PaymentStatus {
  const normalized = status.toLowerCase();
  if (normalized === "success" || normalized === "sandbox") return "success";
  if (normalized === "reversed" || normalized === "refund") return "reversed";
  return "failure";
}

export function isLiqPaySuccessStatus(status: string) {
  const normalized = status.toLowerCase();
  return normalized === "success" || normalized === "sandbox";
}

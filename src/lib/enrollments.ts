import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export async function activateEnrollment(userId: string, courseId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { error: "Admin client is not configured" };
  }

  const admin = await createAdminClient();
  const purchasedAt = new Date().toISOString();

  const { data: existing, error: existingError } = await admin
    .from("enrollments")
    .select("status, purchased_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }

  // Already unlocked — do not downgrade completed → active.
  if (existing?.status === "active" || existing?.status === "completed") {
    if (!existing.purchased_at) {
      await admin
        .from("enrollments")
        .update({ purchased_at: purchasedAt })
        .eq("user_id", userId)
        .eq("course_id", courseId);
    }
    return { error: null, status: existing.status as string };
  }

  const { error } = await admin.from("enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      status: "active",
      purchased_at: purchasedAt,
    },
    { onConflict: "user_id,course_id" },
  );

  return { error: error?.message ?? null, status: error ? null : "active" };
}

/**
 * After a successful LiqPay payment, unlock the course immediately
 * (no admin confirmation). Safe to call repeatedly.
 */
export async function grantCourseAfterSuccessfulPayment(
  userId: string,
  courseId: string,
) {
  return activateEnrollment(userId, courseId);
}

/**
 * Catch-up unlock: any paid payment whose enrollment is still pending.
 * Used when the buyer returns from LiqPay before/after the webhook.
 */
export async function syncPaidCoursesForUser(userId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { activated: 0, error: "Admin client is not configured" };
  }

  const admin = await createAdminClient();
  const { data: payments, error } = await admin
    .from("payments")
    .select("course_id")
    .eq("user_id", userId)
    .eq("status", "success");

  if (error) {
    return { activated: 0, error: error.message };
  }

  const courseIds = [
    ...new Set((payments ?? []).map((row) => String(row.course_id)).filter(Boolean)),
  ];

  let activated = 0;
  for (const courseId of courseIds) {
    const result = await activateEnrollment(userId, courseId);
    if (result.error) {
      console.error("syncPaidCoursesForUser activate failed", { userId, courseId, error: result.error });
      continue;
    }
    if (result.status === "active" || result.status === "completed") {
      activated += 1;
    }
  }

  return { activated, error: null };
}

/** Create a pending enrollment request (server-side, after auth in API routes). */
export async function requestPendingEnrollment(userId: string, courseId: string) {
  if (isSupabaseAdminConfigured()) {
    const admin = await createAdminClient();
    const { data: existing } = await admin
      .from("enrollments")
      .select("status")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing?.status === "active" || existing?.status === "completed") {
      return { error: null };
    }

    const { error } = await admin.from("enrollments").upsert(
      {
        user_id: userId,
        course_id: courseId,
        status: "pending",
        purchased_at: null,
      },
      { onConflict: "user_id,course_id" },
    );

    return { error: error?.message ?? null };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").insert({
    user_id: userId,
    course_id: courseId,
    status: "pending",
    purchased_at: null,
  });

  if (error?.code === "23505") {
    const { data } = await supabase
      .from("enrollments")
      .select("status")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (data?.status === "pending" || data?.status === "active" || data?.status === "completed") {
      return { error: null };
    }
    return {
      error:
        "Запис про покупку вже існує. Зверніться до підтримки або адміністратора.",
    };
  }

  return { error: error?.message ?? null };
}

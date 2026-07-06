import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export async function activateEnrollment(userId: string, courseId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { error: "Admin client is not configured" };
  }

  const admin = await createAdminClient();
  const purchasedAt = new Date().toISOString();

  const { error } = await admin.from("enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      status: "active",
      purchased_at: purchasedAt,
    },
    { onConflict: "user_id,course_id" },
  );

  return { error: error?.message ?? null };
}

/** Create a pending enrollment request (server-side, after auth in API routes). */
export async function requestPendingEnrollment(userId: string, courseId: string) {
  if (isSupabaseAdminConfigured()) {
    const admin = await createAdminClient();
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

    if (data?.status === "pending") return { error: null };
    return {
      error:
        "Запис про покупку вже існує. Зверніться до підтримки або адміністратора.",
    };
  }

  return { error: error?.message ?? null };
}

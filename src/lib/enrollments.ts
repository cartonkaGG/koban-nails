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

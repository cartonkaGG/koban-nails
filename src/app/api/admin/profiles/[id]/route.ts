import { NextResponse } from "next/server";
import { requireAdmin, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.full_name === "string") updates.full_name = body.full_name.trim();
  if (typeof body.phone === "string") updates.phone = body.phone.trim() || null;
  if (body.role === "admin" || body.role === "student") updates.role = body.role;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

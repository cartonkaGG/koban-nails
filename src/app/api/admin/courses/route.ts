import { NextResponse } from "next/server";
import { requireAdmin, isSupabaseConfigured } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ id: "demo-new", ...body });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      title: body.title ?? "Новий курс",
      slug: body.slug ?? `course-${Date.now()}`,
      description: body.description ?? "",
      format: body.format ?? "online",
      price_uah: body.price_uah ?? 0,
      features: body.features ?? [],
      published: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import { requireAdmin, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
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

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("courses")
    .update({
      title: body.title,
      slug: body.slug,
      description: body.description,
      format: body.format,
      price_uah: body.price_uah,
      sale_price_uah: body.sale_price_uah ?? null,
      badge: body.badge,
      featured: body.featured,
      published: body.published,
      features: body.features,
      payment_url: body.payment_url,
      sort_order: body.sort_order,
      image_url: body.image_url ?? null,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

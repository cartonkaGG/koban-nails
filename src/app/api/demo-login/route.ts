import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { role } = await request.json();
  const store = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  store.set("koban_demo_user", role === "admin" ? "admin" : "student", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete("koban_demo_user");
  return NextResponse.json({ ok: true });
}

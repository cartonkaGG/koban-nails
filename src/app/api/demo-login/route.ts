import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { role } = await request.json();
  const store = await cookies();
  store.set("koban_demo_user", role === "admin" ? "admin" : "student", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete("koban_demo_user");
  return NextResponse.json({ ok: true });
}

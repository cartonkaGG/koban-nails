import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/cabinet/:path*",
    "/admin/:path*",
    "/checkout/:path*",
    "/auth/callback",
    "/api/:path*",
  ],
};

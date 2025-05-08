// Temporarily disable Clerk authentication for debugging
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Just pass through all requests without authentication
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)", "/", "/(api|trpc)(.*)"],
}; 
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveLegacyRedirect } from "@/lib/legacyRedirects";

export function middleware(request: NextRequest) {
  const legacyDestination = resolveLegacyRedirect(request.nextUrl.pathname);
  if (legacyDestination) {
    return NextResponse.redirect(new URL(legacyDestination, request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

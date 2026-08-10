import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveLegacyRedirect } from "@/lib/legacyRedirects";

/** Cloudflare Workers の Production URL（Preview の *-xxx.workers.dev は対象外） */
const PRODUCTION_WORKERS_HOST = "20260807-40kaigonavi.sonozono.workers.dev";

function getCanonicalSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim();
  return (fromEnv || "https://sonocafe.xyz").replace(/\/$/, "");
}

/** 本番 workers.dev → sonocafe.xyz（SEO・URL 統一） */
function redirectProductionWorkersDev(
  request: NextRequest,
): NextResponse | null {
  const host = request.headers.get("host")?.split(":")[0];
  if (host !== PRODUCTION_WORKERS_HOST) {
    return null;
  }

  const target = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    getCanonicalSiteUrl(),
  );
  return NextResponse.redirect(target, 301);
}

export function middleware(request: NextRequest) {
  const workersRedirect = redirectProductionWorkersDev(request);
  if (workersRedirect) {
    return workersRedirect;
  }

  const legacyDestination = resolveLegacyRedirect(request.nextUrl.pathname);
  if (legacyDestination) {
    return NextResponse.redirect(new URL(legacyDestination, request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 旧 WP パス + 本番 workers.dev 用。
     * 静的ファイル・_next は除外。
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

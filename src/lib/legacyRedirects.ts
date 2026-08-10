/**
 * WordPress sonocafe.xyz → Next.js 移行用 301。
 * NS 切替後は Xserver の .htaccess ではなく、ここで旧 URL を処理する。
 *
 * OpenNext on Cloudflare では next.config redirects が効かないため middleware でも使用。
 * 正本: docs/sonocafe-legacy-redirects.md
 */
export const LEGACY_PATH_MAP: Record<string, string> = {
  // --- 記事（ルート slug → /posts/slug）---
  "/care-depression": "/posts/care-depression",
  "/dementia-treatment-method": "/posts/dementia-treatment-method",
  "/elderly-care-services-comparison": "/posts/elderly-care-services-comparison",
  "/non-insurance-nursing-care-services-types-and-cost":
    "/posts/non-insurance-nursing-care-services-types-and-cost",
  "/nursinghome-expensive": "/posts/nursinghome-expensive",

  // --- カテゴリ（/category/... → ハブ）---
  "/category/%e4%bb%8b%e8%ad%b7%e3%81%ae%e3%81%8a%e6%82%a9%e3%81%bf":
    "/pages/care-worries",
  "/category/%e4%bb%8b%e8%ad%b7%e3%81%ae%e6%82%a9%e3%81%bf": "/pages/care-worries",
  "/category/%e5%ae%9f%e5%ae%b6%e3%81%98%e3%81%be%e3%81%84":
    "/pages/closing-family-home",
  "/category/%e8%80%81%e4%ba%ba%e3%83%9b%e3%83%bc%e3%83%a0%e9%81%b8%e3%81%b3":
    "/pages/nursing-home",
  "/category/%e9%ab%98%e9%bd%a2%e8%80%85%e4%be%bf%e5%88%a9%e3%82%b0%e3%83%83%e3%82%ba":
    "/pages/elderly-goods",
  "/category/%e9%ab%98%e9%bd%a2%e8%80%85%e8%a6%8b%e5%ae%88%e3%82%8a":
    "/pages/elderly-monitoring",
  "/category/uncategorized": "/posts",

  // --- 旧固定ページ（日本語 slug → 新パス）---
  "/%e9%ab%98%e9%bd%a2%e8%80%85%e8%a6%8b%e5%ae%88%e3%82%8a": "/pages/elderly-monitoring",
  "/%e8%80%81%e4%ba%ba%e3%83%9b%e3%83%bc%e3%83%a0%e6%8e%a2%e3%81%97": "/pages/nursing-home",
  "/%e5%ae%9f%e5%ae%b6%e3%81%98%e3%81%be%e3%81%84": "/pages/closing-family-home",
  "/%e4%bb%8b%e8%ad%b7%e3%81%ae%e4%be%bf%e5%88%a9%e3%82%b0%e3%83%83%e3%82%ba":
    "/pages/elderly-goods",
  "/%e3%83%97%e3%83%ad%e3%83%95%e3%82%a3%e3%83%bc%e3%83%ab": "/about",
  "/%e6%96%b0%e3%83%97%e3%83%a9%e3%82%a4%e3%83%90%e3%82%b7%e3%83%bc%e3%83%9d%e3%83%aa%e3%82%b7%e3%83%bc":
    "/privacy",
  "/%e3%81%8a%e5%95%8f%e5%90%88%e3%81%9b": "/contact",
  "/%e4%bb%8b%e8%ad%b7%e3%81%a8%e3%81%8a%e9%87%91": "/",

  // --- その他 ---
  "/feed": "/",
};

export function resolveLegacyRedirect(pathname: string): string | undefined {
  if (LEGACY_PATH_MAP[pathname]) {
    return LEGACY_PATH_MAP[pathname];
  }

  const withoutTrailingSlash =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if (LEGACY_PATH_MAP[withoutTrailingSlash]) {
    return LEGACY_PATH_MAP[withoutTrailingSlash];
  }

  const withTrailingSlash = pathname.endsWith("/")
    ? pathname
    : `${pathname}/`;

  return LEGACY_PATH_MAP[withTrailingSlash];
}

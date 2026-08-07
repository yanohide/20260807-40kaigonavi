/**
 * 本番の正式URL（Search Console / sitemap / metadata 用）
 * 環境変数があれば優先。未設定時は sonoke.com。
 */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return "https://sonocafe.xyz";
}

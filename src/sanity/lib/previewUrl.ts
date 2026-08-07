/**
 * Studio（Vite / Next 埋め込みどちらも）用のプレビュー URL 組み立て。
 * シークレット未設定のときは null を返し、呼び出し側で案内する。
 */
export function buildDraftPreviewUrl(slug: string): string | null {
  const base = (
    process.env.SANITY_STUDIO_PREVIEW_URL ||
    process.env.NEXT_PUBLIC_SANITY_PREVIEW_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const secret =
    process.env.SANITY_STUDIO_PREVIEW_SECRET ||
    process.env.NEXT_PUBLIC_SANITY_PREVIEW_SECRET ||
    "";

  if (!secret.trim()) {
    return null;
  }

  return (
    `${base}/api/draft-mode/enable` +
    `?secret=${encodeURIComponent(secret)}` +
    `&slug=${encodeURIComponent(slug)}`
  );
}

export function openDraftPreview(slug: string): void {
  const url = buildDraftPreviewUrl(slug);
  if (!url) {
    window.alert(
      "プレビュー用の合言葉が Studio に渡っていません。\n" +
        ".env.local に SANITY_STUDIO_PREVIEW_SECRET を設定し、" +
        "Studio（npm run studio）を再起動してください。",
    );
    return;
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.alert(
      "ポップアップがブロックされました。ブラウザで許可するか、次の URL を別タブで開いてください。\n\n" +
        url.replace(/([?&]secret=)[^&]*/i, "$1***"),
    );
  }
}

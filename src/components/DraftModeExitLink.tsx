"use client";

import { usePathname } from "next/navigation";

/**
 * プレビュー終了リンク。
 * SPA のソフト遷移だと Cookie 削除後も RSC キャッシュで
 * 「下書きのまま」に見えることがあるため、フルリロードで遷移する。
 */
export function DraftModeExitLink() {
  const pathname = usePathname() || "/posts";
  const href = `/api/draft-mode/disable?redirect=${encodeURIComponent(pathname)}`;

  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(href);
      }}
      style={{
        background: "#fff",
        color: "#1a1a2e",
        borderRadius: "999px",
        padding: "4px 14px",
        fontWeight: 700,
        textDecoration: "none",
      }}
    >
      プレビューを終了
    </a>
  );
}

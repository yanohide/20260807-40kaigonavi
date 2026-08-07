import { draftMode } from "next/headers";

import { DraftModeExitLink } from "@/components/DraftModeExitLink";

/**
 * 下書きプレビュー表示中に画面下部へ出す帯。
 * 「プレビューを終了」で通常表示（公開済みのみ）に戻す。
 * Draft Mode の bypass Cookie を持つリクエストにだけ動的表示されるため、
 * 通常訪問者向けの静的生成は維持される。
 */
export async function DraftModeBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "10px 16px",
        background: "#1a1a2e",
        color: "#fff",
        fontSize: "14px",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.25)",
      }}
    >
      <span>下書きプレビュー表示中（未公開の内容が見えています）</span>
      <DraftModeExitLink />
    </div>
  );
}

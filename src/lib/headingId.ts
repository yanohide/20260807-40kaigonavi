/** 記事見出し用のアンカー ID（日本語をそのまま使える形に正規化） */
export function toHeadingId(text: string): string {
  return String(text || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\-_【】\[\]「」『』・／①-⑩]/gu, "");
}

/** 目次文言 → 実際の見出しテキスト（表記ゆれ吸収） */
const TOC_ALIASES: Record<string, string> = {
  "仮想通貨が課税対象になるタイミング【４つ】":
    "仮想通貨取引で課税対象となるタイミング【４つ】",
  "質問と回答【４つ】": "質問と回答",
};

export function resolveTocHeadingText(label: string): string {
  const trimmed = String(label || "").trim();
  if (TOC_ALIASES[trimmed]) return TOC_ALIASES[trimmed];
  return trimmed;
}

export function tocHrefForLabel(label: string): string {
  return `#${toHeadingId(resolveTocHeadingText(label))}`;
}

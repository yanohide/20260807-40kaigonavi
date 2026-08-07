/** Sanity の date / datetime を JST 基準で安定表示（SSR/CSR 差分を避ける） */
export function formatDateJa(value?: string): string {
  if (!value) return "";

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${Number(year)}年${Number(month)}月${Number(day)}日`;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

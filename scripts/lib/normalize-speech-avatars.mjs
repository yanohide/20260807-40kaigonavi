/**
 * WP由来の「アバター画像＋ラベル」行を :::speech に正規化する。
 *
 * 例:
 *   ![](...0e37988b....png)悩む人
 *
 *   質問文…
 *
 * →
 *   :::speech
 *   speaker: 悩む人
 *   side: left
 *   tone: sky
 *
 *   質問文…
 *   :::
 *
 * sonoko / ヤノヒデ → 右（ヤノヒデ）吹き出し。
 */

const AVATAR_LINE =
  /^!\[[^\]]*\]\([^)]+\)(悩む人|質問者|sonoko|ヤノヒデ|案内)\s*$/;

const STOP_LINE =
  /^(あわせて読みたい|上記のような|この記事では|結論[、,]|本記事|:::|\*\*記事の|\*\*本記事|\*\*この記事)/;

/**
 * @param {string} md
 * @returns {{ text: string, converted: number }}
 */
export function normalizeSpeechAvatars(md) {
  const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let converted = 0;
  let i = 0;

  while (i < lines.length) {
    const m = lines[i].match(AVATAR_LINE);
    if (!m) {
      out.push(lines[i]);
      i += 1;
      continue;
    }

    const label = m[1];
    i += 1;
    while (i < lines.length && lines[i].trim() === "") i += 1;

    const body = [];
    while (i < lines.length) {
      const L = lines[i];
      if (AVATAR_LINE.test(L)) break;
      if (/^#{1,6}\s/.test(L)) break;
      if (/^:::/.test(L)) break;
      if (STOP_LINE.test(L.trim())) break;
      if (L.trim() === "") break;
      body.push(L);
      i += 1;
    }

    if (body.length === 0) {
      // 孤立アバター行は捨てる（吹き出し本文なし）
      continue;
    }

    const isQuestioner = label === "悩む人" || label === "質問者";
    const speaker = isQuestioner
      ? "悩む人"
      : label === "案内"
        ? "案内"
        : "ひよこ忍者";
    const side = speaker === "ひよこ忍者" || speaker === "ヤノヒデ" ? "right" : "left";

    out.push(":::speech");
    out.push(`speaker: ${speaker}`);
    out.push(`side: ${side}`);
    if (side === "left") out.push("tone: sky");
    out.push("");
    out.push(...body);
    out.push(":::");
    out.push("");
    converted += 1;
  }

  return { text: out.join("\n"), converted };
}

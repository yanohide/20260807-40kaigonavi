import type { ReactNode } from "react";

type Token =
  | { type: "text"; value: string }
  | { type: "br" }
  | { type: "link"; href: string; children: Token[] }
  | { type: "strong"; children: Token[] }
  | { type: "image"; alt: string; src: string };

/** セル内の簡易 Markdown（リンク・太字・画像・`<br>`）をトークン化 */
export function tokenizeCellMarkdown(input: string): Token[] {
  const src = String(input ?? "");
  if (!src) return [];

  const tokens: Token[] = [];
  let i = 0;

  const pushText = (value: string) => {
    if (!value) return;
    const last = tokens[tokens.length - 1];
    if (last?.type === "text") last.value += value;
    else tokens.push({ type: "text", value });
  };

  while (i < src.length) {
    if (src.startsWith("<br>", i) || src.startsWith("<br/>", i) || src.startsWith("<br />", i)) {
      tokens.push({ type: "br" });
      i += src.startsWith("<br />", i) ? 6 : src.startsWith("<br/>", i) ? 5 : 4;
      continue;
    }
    if (src[i] === "\n") {
      tokens.push({ type: "br" });
      i += 1;
      continue;
    }

    const img = src.slice(i).match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/);
    if (img) {
      tokens.push({ type: "image", alt: img[1], src: img[2] });
      i += img[0].length;
      continue;
    }

    const link = src.slice(i).match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
    if (link) {
      tokens.push({
        type: "link",
        href: link[2],
        children: tokenizeCellMarkdown(link[1]),
      });
      i += link[0].length;
      continue;
    }

    const strong = src.slice(i).match(/^\*\*([^*]+)\*\*/);
    if (strong) {
      tokens.push({
        type: "strong",
        children: tokenizeCellMarkdown(strong[1]),
      });
      i += strong[0].length;
      continue;
    }

    pushText(src[i]);
    i += 1;
  }

  return tokens;
}

function walkText(tokens: Token[]): string {
  return tokens
    .map((token) => {
      if (token.type === "text") return token.value;
      if (token.type === "br") return " ";
      if (token.type === "image") return "";
      if (token.type === "link" || token.type === "strong") {
        return walkText(token.children);
      }
      return "";
    })
    .join("");
}

/** 数字判定・整列用に装飾を除いたテキスト */
export function cellTextForAlign(value: string): string {
  return walkText(tokenizeCellMarkdown(value)).replace(/\s+/g, " ").trim();
}

function renderTokens(tokens: Token[], keyPrefix: string): ReactNode[] {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (token.type) {
      case "text":
        return <span key={key}>{token.value}</span>;
      case "br":
        return <br key={key} />;
      case "strong":
        return <strong key={key}>{renderTokens(token.children, key)}</strong>;
      case "link":
        return (
          <a
            key={key}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            className="article-table-link"
          >
            {renderTokens(token.children, key)}
          </a>
        );
      case "image":
        return (
          // eslint-disable-next-line @next/next/no-img-element -- 表セルは外部アイコン URL を直接表示
          <img
            key={key}
            src={token.src}
            alt={token.alt || ""}
            width={80}
            height={80}
            className="article-table-icon"
            loading="lazy"
          />
        );
      default:
        return null;
    }
  });
}

/** 表セル用：リンク・アイコン画像・改行付きテキストを描画 */
export function TableCellRich({ value }: { value: string }) {
  const tokens = tokenizeCellMarkdown(value);
  if (tokens.length === 0) return null;
  return <>{renderTokens(tokens, "c")}</>;
}

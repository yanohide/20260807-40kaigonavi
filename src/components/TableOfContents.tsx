import type { PortableTextBlock } from "@portabletext/types";

import { toHeadingId } from "@/lib/headingId";

export type TocItem = {
  id: string;
  level: 2 | 3;
  number: string;
  text: string;
};

type HeadingBlock = {
  _type?: string;
  style?: string;
  children?: { text?: string }[];
};

/** 本文 PortableText から h2/h3 だけを抽出して、TOC 項目と「最初の見出しの位置」を返す。 */
export function extractToc(body: PortableTextBlock[] | null | undefined): {
  items: TocItem[];
  firstHeadingIndex: number;
} {
  if (!Array.isArray(body) || body.length === 0) {
    return { items: [], firstHeadingIndex: -1 };
  }
  const items: TocItem[] = [];
  let h2Counter = 0;
  let h3Counter = 0;
  let firstHeadingIndex = -1;

  body.forEach((b, idx) => {
    const block = b as HeadingBlock;
    if (block?._type !== "block") return;
    const style = block.style;
    if (style !== "h2" && style !== "h3") return;
    const text = (block.children ?? [])
      .map((c) => (typeof c?.text === "string" ? c.text : ""))
      .join("")
      .trim();
    const id = toHeadingId(text);
    if (!text || !id) return;
    if (firstHeadingIndex < 0) firstHeadingIndex = idx;
    if (style === "h2") {
      h2Counter++;
      h3Counter = 0;
      items.push({ id, level: 2, number: `${h2Counter}`, text });
    } else {
      h3Counter++;
      items.push({ id, level: 3, number: `${h2Counter}-${h3Counter}`, text });
    }
  });

  return { items, firstHeadingIndex };
}

/** リード文末に置く目次カード。本文の h2/h3 から自動生成する。 */
export function TableOfContents({ items }: { items: TocItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <nav className="article-toc not-prose" aria-label="目次">
      <p className="article-toc-heading">
        <span aria-hidden className="article-toc-icon">
          ☰
        </span>
        目次
      </p>
      <ol className="article-toc-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={
              item.level === 3
                ? "article-toc-item article-toc-item--sub"
                : "article-toc-item"
            }
          >
            <a href={`#${item.id}`} className="article-toc-link">
              <span className="article-toc-number">{item.number}</span>
              <span aria-hidden className="article-toc-sep">
                ｜
              </span>
              <span className="article-toc-text">{item.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

import { toPlainText } from "@portabletext/toolkit";
import type { PortableTextBlock } from "@portabletext/types";

import type { TableRow } from "@/components/blocks/TableBlock";

export type TablePortableBlock = PortableTextBlock & {
  _type: "table";
  _key?: string;
  rows?: TableRow[];
};

type TextBlock = PortableTextBlock & {
  _key?: string;
  style?: string;
};

function isSeparatorRow(line: string): boolean {
  const cells = line.trim().slice(1, -1).split("|");
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
  );
}

function parseRow(line: string): string[] {
  return line
    .trim()
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.replace(/\s+/g, " ").trim());
}

/** セル内改行で折り返された Markdown 表行を 1 行に戻す */
function mergeWrappedTableLines(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("|") || lines.length === 0) {
      lines.push(line);
    } else {
      lines[lines.length - 1] += ` ${line}`;
    }
  }
  return lines;
}

/** GFM 形式の Markdown 表テキスト → TableBlock 用 rows */
export function parseMarkdownTableText(text: string): TableRow[] | null {
  const lines = mergeWrappedTableLines(text.trim());
  if (lines.length < 3) return null;
  if (!lines[0].startsWith("|") || !lines[0].endsWith("|")) return null;
  if (!isSeparatorRow(lines[1])) return null;

  const header = parseRow(lines[0]);
  if (header.length < 2) return null;

  const rows: TableRow[] = [{ cells: header }];
  for (const line of lines.slice(2)) {
    if (!line.startsWith("|") || !line.endsWith("|")) continue;
    const cells = parseRow(line);
    if (cells.length !== header.length) continue;
    rows.push({ cells });
  }

  return rows.length >= 2 ? rows : null;
}

function blockPlainText(block: TextBlock): string {
  return toPlainText([block]).trim();
}

/**
 * Studio 貼り付けや変換漏れで通常段落になった Markdown 表を table ブロックへ正規化（表示側）。
 */
export function promoteMarkdownTableBlocks(
  blocks: PortableTextBlock[] | undefined | null,
): PortableTextBlock[] {
  if (!blocks?.length) return [];

  const out: PortableTextBlock[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as TextBlock;
    if (block._type === "block" && block.style === "normal") {
      const text = blockPlainText(block);
      if (text.includes("|") && text.includes("---")) {
        const rows = parseMarkdownTableText(text);
        if (rows) {
          out.push({
            _type: "table",
            _key: block._key || `table-promoted-${i}`,
            rows: rows.map((row, ri) => ({
              _key: `${block._key || i}-row-${ri}`,
              cells: row.cells,
            })),
          } as TablePortableBlock);
          continue;
        }
      }
    }
    out.push(block);
  }

  return out;
}

import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { toPlainText } from "@portabletext/toolkit";
import type { ReactNode } from "react";

import {
  postPortableComponents,
  referencePortableComponents,
} from "@/components/portableText/baseComponents";
import { extractToc, TableOfContents } from "@/components/TableOfContents";
import { promoteAffiliateCtaBlocks } from "@/lib/promoteAffiliateCtas";
import { promoteAppReachBlocks } from "@/lib/promoteAppReachBlocks";
import { promoteMarkdownTableBlocks } from "@/lib/promoteMarkdownTableBlocks";

function isHeadingBlock(block: PortableTextBlock) {
  return (
    block?._type === "block" &&
    ["h2", "h3", "h4"].includes(String(block.style || ""))
  );
}

function isReferenceHeading(block: PortableTextBlock) {
  if (!isHeadingBlock(block)) return false;
  const text = toPlainText([block]).replace(/\s+/g, "");
  return (
    text.includes("参考文献") ||
    text.includes("参考資料") ||
    text.includes("出典一覧")
  );
}

/**
 * 参考文献セクションだけ専用の表示設定で描画する。
 * 既存記事の通常ブロック形式と、sourceList 形式の両方に対応する。
 */
function renderArticleBlocks(blocks: PortableTextBlock[]): ReactNode[] {
  const rendered: ReactNode[] = [];
  let regularBlocks: PortableTextBlock[] = [];

  const flushRegularBlocks = () => {
    if (regularBlocks.length === 0) return;
    rendered.push(
      <PortableText
        key={`regular-${rendered.length}`}
        value={regularBlocks}
        components={postPortableComponents}
      />,
    );
    regularBlocks = [];
  };

  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index];
    if (!isReferenceHeading(block)) {
      regularBlocks.push(block);
      index += 1;
      continue;
    }

    flushRegularBlocks();
    const referenceBlocks: PortableTextBlock[] = [block];
    index += 1;
    while (index < blocks.length && !isHeadingBlock(blocks[index])) {
      referenceBlocks.push(blocks[index]);
      index += 1;
    }

    rendered.push(
      <div className="article-reference-section" key={`reference-${index}`}>
        <PortableText
          value={referenceBlocks}
          components={referencePortableComponents}
        />
      </div>,
    );
  }

  flushRegularBlocks();
  return rendered;
}

export function PostBody({ value }: { value: PortableTextBlock[] }) {
  const blocks = promoteAppReachBlocks(
    promoteAffiliateCtaBlocks(promoteMarkdownTableBlocks(value)),
  );
  const { items, firstHeadingIndex } = extractToc(blocks);
  const leadBlocks =
    firstHeadingIndex >= 0 ? blocks.slice(0, firstHeadingIndex) : blocks;
  const restBlocks =
    firstHeadingIndex >= 0 ? blocks.slice(firstHeadingIndex) : [];

  return (
    <>
      {renderArticleBlocks(leadBlocks)}
      <TableOfContents items={items} />
      {restBlocks.length > 0 ? (
        renderArticleBlocks(restBlocks)
      ) : null}
    </>
  );
}

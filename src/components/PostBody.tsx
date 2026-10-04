import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

import { postPortableComponents } from "@/components/portableText/baseComponents";
import { extractToc, TableOfContents } from "@/components/TableOfContents";
import { promoteAffiliateCtaBlocks } from "@/lib/promoteAffiliateCtas";
import { promoteAppReachBlocks } from "@/lib/promoteAppReachBlocks";
import { promoteMarkdownTableBlocks } from "@/lib/promoteMarkdownTableBlocks";

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
      <PortableText value={leadBlocks} components={postPortableComponents} />
      <TableOfContents items={items} />
      {restBlocks.length > 0 ? (
        <PortableText value={restBlocks} components={postPortableComponents} />
      ) : null}
    </>
  );
}

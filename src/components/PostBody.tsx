import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

import { postPortableComponents } from "@/components/portableText/baseComponents";
import { promoteAffiliateCtaBlocks } from "@/lib/promoteAffiliateCtas";
import { promoteAppReachBlocks } from "@/lib/promoteAppReachBlocks";
import { promoteMarkdownTableBlocks } from "@/lib/promoteMarkdownTableBlocks";

export function PostBody({ value }: { value: PortableTextBlock[] }) {
  const blocks = promoteAppReachBlocks(
    promoteAffiliateCtaBlocks(promoteMarkdownTableBlocks(value)),
  );
  return <PortableText value={blocks} components={postPortableComponents} />;
}

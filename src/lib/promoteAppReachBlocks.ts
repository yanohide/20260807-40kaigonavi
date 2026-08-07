import type { PortableTextBlock } from "@portabletext/types";

const APPREACH_META_RE = /posted with|アプリーチ|AppReach/i;
const STORE_HREF_RE =
  /(?:apps\.apple\.com|itunes\.apple\.com|play\.google\.com)/i;
const APPREACH_ASSET_RE =
  /appreach|itune_ja|gplay_ja|nabettu\.github\.io\/appreach/i;

type Span = {
  _type?: string;
  text?: string;
  marks?: string[];
};

type MarkDef = {
  _key?: string;
  _type?: string;
  href?: string;
};

type ImageBlock = {
  _key?: string;
  _type?: string;
  alt?: string;
  src?: string;
  asset?: {
    originalFilename?: string;
    metadata?: { dimensions?: { width?: number; height?: number } };
  };
};

type PtBlock = PortableTextBlock & {
  _key?: string;
  style?: string;
  listItem?: string;
  children?: Span[];
  markDefs?: MarkDef[];
  alt?: string;
  src?: string;
  asset?: ImageBlock["asset"];
};

export type AppReachStoreBadge = {
  image?: ImageBlock;
  url?: string;
};

export type AppReachCardBlock = PortableTextBlock & {
  _type: "appReachCard";
  title?: string;
  meta?: string;
  appReachLabel?: string;
  appReachUrl?: string;
  icon?: ImageBlock;
  storeBadges?: AppReachStoreBadge[];
  /** @deprecated 表示側フォールバック（旧 Sanity 入稿） */
  titleBlock?: PtBlock;
  /** @deprecated 表示側フォールバック（旧 Sanity 入稿） */
  metaBlock?: PtBlock;
  /** @deprecated 表示側フォールバック（旧 Sanity 入稿） */
  storeImages?: ImageBlock[];
  /** @deprecated 表示側フォールバック（旧 Sanity 入稿） */
  storeLinksBlock?: PtBlock;
};

function blockPlainText(block: PtBlock): string {
  return (block.children || []).map((c) => c.text || "").join("").trim();
}

function imageSrc(block: PtBlock): string {
  return String(block.src || block.asset?.originalFilename || "");
}

function imageDimensions(block: PtBlock): { w: number; h: number } {
  const w = Number(block.asset?.metadata?.dimensions?.width) || 0;
  const h = Number(block.asset?.metadata?.dimensions?.height) || 0;
  return { w, h };
}

function isAppReachMetaBlock(block: PtBlock): boolean {
  if (block._type !== "block") return false;
  if (block.listItem) return false;
  if (block.style && block.style !== "normal") return false;
  return APPREACH_META_RE.test(blockPlainText(block));
}

function isStoreLinksBlock(block: PtBlock): boolean {
  if (block._type !== "block") return false;
  if (block.listItem) return false;
  return (block.markDefs || []).some(
    (m) =>
      m._type === "link" &&
      typeof m.href === "string" &&
      STORE_HREF_RE.test(m.href),
  );
}

function isSquareAppIcon(block: PtBlock): boolean {
  if (block._type !== "image") return false;
  const src = imageSrc(block);
  if (APPREACH_ASSET_RE.test(src)) return false;

  const { w, h } = imageDimensions(block);
  if (w > 0 && h > 0) {
    const ratio = w / h;
    return ratio >= 0.78 && ratio <= 1.28 && Math.min(w, h) >= 96;
  }

  const alt = String(block.alt || "").trim();
  return alt.length >= 8 && !APPREACH_META_RE.test(alt);
}

/** 本文 figure として単独表示される App Store 系アイコン（512×512 等）を除外 */
export function shouldHideStandaloneAppIconImage(block: {
  alt?: string;
  src?: string;
  asset?: ImageBlock["asset"];
}): boolean {
  const alt = String(block.alt || "");
  const src = String(block.src || block.asset?.originalFilename || "");
  if (APPREACH_ASSET_RE.test(src)) return false;

  if (/mzstatic\.com|play-lh\.googleusercontent\.com/i.test(src)) return true;
  if (/512x512|AppIcon|logo_authenticator/i.test(`${src}${alt}`)) return true;

  const { w, h } = imageDimensions(block as PtBlock);
  if (w > 0 && h > 0) {
    const ratio = w / h;
    return (
      ratio >= 0.78 &&
      ratio <= 1.28 &&
      Math.min(w, h) >= 96 &&
      Math.max(w, h) <= 512
    );
  }

  return false;
}

function isStoreBadgeImage(block: PtBlock): boolean {
  if (block._type !== "image") return false;
  const src = imageSrc(block);
  if (APPREACH_ASSET_RE.test(src)) return true;

  const { w, h } = imageDimensions(block);
  if (w > 0 && h > 0) {
    if (h <= 120 && w / h >= 1.8) return true;
    if (w <= 200 && h <= 80) return true;
  }

  return false;
}

function isAppReachTitleBlock(block: PtBlock): boolean {
  if (block._type !== "block") return false;
  if (block.listItem) return false;
  if (block.style && block.style !== "normal") return false;
  if (isAppReachMetaBlock(block) || isStoreLinksBlock(block)) return false;

  const text = blockPlainText(block);
  if (!text) return false;
  if (text.length > 140) return false;
  return true;
}

function extractAppReachLink(block: PtBlock): {
  appReachUrl?: string;
  appReachLabel: string;
} {
  const def = (block.markDefs || []).find(
    (m) =>
      m._type === "link" &&
      typeof m.href === "string" &&
      (/app-reach|アプリーチ|mama-hack\.com/i.test(m.href) ||
        /app-reach|アプリーチ/i.test(blockPlainText(block))),
  );
  if (!def?.href || typeof def.href !== "string")
    return { appReachLabel: "アプリーチ" };

  const labelSpan = (block.children || []).find((c) =>
    (c.marks || []).includes(String(def._key || "")),
  );
  return {
    appReachUrl: def.href,
    appReachLabel: (labelSpan?.text || "アプリーチ").trim() || "アプリーチ",
  };
}

function metaTextFromBlock(block: PtBlock): string {
  return blockPlainText(block)
    .replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function storeBadgesFromLinksBlock(block: PtBlock): AppReachStoreBadge[] {
  const out: AppReachStoreBadge[] = [];
  for (const def of block.markDefs || []) {
    if (def._type !== "link" || typeof def.href !== "string") continue;
    if (!STORE_HREF_RE.test(def.href)) continue;
    out.push({ url: def.href });
  }
  return out;
}

function tryParseAppReachGroup(
  blocks: PortableTextBlock[],
  start: number,
): { card: AppReachCardBlock; nextIndex: number } | null {
  let idx = start;
  let icon: ImageBlock | undefined;

  if (isSquareAppIcon(blocks[idx] as PtBlock)) {
    icon = blocks[idx] as ImageBlock;
    idx++;
  }

  const titleBlock = blocks[idx] as PtBlock | undefined;
  if (!titleBlock || !isAppReachTitleBlock(titleBlock)) return null;
  idx++;

  const metaBlock = blocks[idx] as PtBlock | undefined;
  if (!metaBlock || !isAppReachMetaBlock(metaBlock)) return null;
  idx++;

  const storeImages: ImageBlock[] = [];
  const storeLinkBlocks: PtBlock[] = [];
  while (idx < blocks.length) {
    const next = blocks[idx] as PtBlock;
    if (isStoreBadgeImage(next)) {
      storeImages.push(next as ImageBlock);
      idx++;
      continue;
    }
    if (isStoreLinksBlock(next)) {
      storeLinkBlocks.push(next);
      idx++;
      continue;
    }
    break;
  }

  const { appReachUrl, appReachLabel } = extractAppReachLink(metaBlock);
  const storeBadges: AppReachStoreBadge[] = [
    ...storeImages.map((image) => ({ image })),
    ...storeLinkBlocks.flatMap((b) => storeBadgesFromLinksBlock(b)),
  ];

  return {
    card: {
      _type: "appReachCard",
      _key: `appreach-${start}`,
      title: blockPlainText(titleBlock),
      meta: metaTextFromBlock(metaBlock),
      appReachLabel,
      ...(appReachUrl ? { appReachUrl } : {}),
      ...(icon ? { icon } : {}),
      ...(storeBadges.length ? { storeBadges } : {}),
    } as AppReachCardBlock,
    nextIndex: idx,
  };
}

/**
 * WP「アプリーチ」由来の連続ブロックを appReachCard へ正規化（表示側）。
 * Sanity 上で appReachCard 化済みのブロックはそのまま通す。
 */
export function promoteAppReachBlocks(
  blocks: PortableTextBlock[] | undefined | null,
): PortableTextBlock[] {
  if (!blocks?.length) return [];

  const out: PortableTextBlock[] = [];

  for (let i = 0; i < blocks.length; ) {
    const block = blocks[i] as AppReachCardBlock;
    if (block?._type === "appReachCard" && block.title) {
      out.push(block);
      i++;
      continue;
    }

    const grouped = tryParseAppReachGroup(blocks, i);
    if (grouped) {
      out.push(grouped.card);
      i = grouped.nextIndex;
      continue;
    }

    out.push(blocks[i]);
    i++;
  }

  return out;
}

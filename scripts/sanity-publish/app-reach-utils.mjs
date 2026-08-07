/** WP「アプリーチ」ブロック検出・正規化（MD 入稿 / Portable Text 後処理で共用） */

export const APPREACH_META_RE = /posted with|アプリーチ|AppReach/i;
export const STORE_HREF_RE =
  /(?:apps\.apple\.com|itunes\.apple\.com|play\.google\.com)/i;
export const APPREACH_ASSET_RE =
  /appreach|itune_ja|gplay_ja|nabettu\.github\.io\/appreach/i;

export function blockPlainText(block) {
  if (!block || block._type !== "block") return "";
  return (block.children || []).map((c) => c.text || "").join("").trim();
}

export function imageSrc(block) {
  if (!block || block._type !== "image") return "";
  return String(block.src || block.asset?.originalFilename || "");
}

export function imageDimensions(block) {
  const w = Number(block?.asset?.metadata?.dimensions?.width) || 0;
  const h = Number(block?.asset?.metadata?.dimensions?.height) || 0;
  return { w, h };
}

export function isAppReachMetaBlock(block) {
  if (!block || block._type !== "block") return false;
  if (block.listItem) return false;
  if (block.style && block.style !== "normal") return false;
  return APPREACH_META_RE.test(blockPlainText(block));
}

export function isStoreLinksBlock(block) {
  if (!block || block._type !== "block") return false;
  if (block.listItem) return false;
  return (block.markDefs || []).some(
    (m) =>
      m._type === "link" &&
      typeof m.href === "string" &&
      STORE_HREF_RE.test(m.href),
  );
}

export function isSquareAppIcon(block) {
  if (!block || block._type !== "image") return false;
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

export function isStoreBadgeImage(block) {
  if (!block || block._type !== "image") return false;
  const src = imageSrc(block);
  if (APPREACH_ASSET_RE.test(src)) return true;

  const { w, h } = imageDimensions(block);
  if (w > 0 && h > 0) {
    if (h <= 120 && w / h >= 1.8) return true;
    if (w <= 200 && h <= 80) return true;
  }

  return false;
}

export function isAppReachTitleBlock(block) {
  if (!block || block._type !== "block") return false;
  if (block.listItem) return false;
  if (block.style && block.style !== "normal") return false;
  if (isAppReachMetaBlock(block) || isStoreLinksBlock(block)) return false;

  const text = blockPlainText(block);
  if (!text) return false;
  if (text.length > 140) return false;
  return true;
}

export function extractAppReachLink(block) {
  const def = (block?.markDefs || []).find(
    (m) =>
      m._type === "link" &&
      typeof m.href === "string" &&
      (/app-reach|アプリーチ|mama-hack\.com/i.test(m.href) ||
        /app-reach|アプリーチ/i.test(blockPlainText(block))),
  );
  if (!def?.href) return { appReachUrl: "", appReachLabel: "アプリーチ" };

  const labelSpan = (block.children || []).find((c) =>
    (c.marks || []).includes(String(def._key || "")),
  );
  return {
    appReachUrl: def.href,
    appReachLabel: (labelSpan?.text || "アプリーチ").trim() || "アプリーチ",
  };
}

export function metaTextFromBlock(block) {
  const plain = blockPlainText(block);
  return plain
    .replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function storeBadgesFromLinksBlock(block) {
  if (!block || block._type !== "block") return [];
  const out = [];
  for (const def of block.markDefs || []) {
    if (def._type !== "link" || typeof def.href !== "string") continue;
    if (!STORE_HREF_RE.test(def.href)) continue;
    out.push({ url: def.href });
  }
  return out;
}

export function tryParseAppReachGroup(blocks, start, keyFn) {
  let idx = start;
  let icon;

  if (isSquareAppIcon(blocks[idx])) {
    icon = blocks[idx];
    idx++;
  }

  const titleBlock = blocks[idx];
  if (!titleBlock || !isAppReachTitleBlock(titleBlock)) return null;
  idx++;

  const metaBlock = blocks[idx];
  if (!metaBlock || !isAppReachMetaBlock(metaBlock)) return null;
  idx++;

  const storeImages = [];
  const storeLinkBlocks = [];
  while (idx < blocks.length) {
    const next = blocks[idx];
    if (isStoreBadgeImage(next)) {
      storeImages.push(next);
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
  const storeBadges = [
    ...storeImages.map((image) => ({ image })),
    ...storeLinkBlocks.flatMap((b) => storeBadgesFromLinksBlock(b)),
  ];

  return {
    card: {
      _type: "appReachCard",
      _key: keyFn(start),
      title: blockPlainText(titleBlock),
      meta: metaTextFromBlock(metaBlock),
      appReachLabel,
      ...(appReachUrl ? { appReachUrl } : {}),
      ...(icon ? { icon } : {}),
      ...(storeBadges.length ? { storeBadges } : {}),
    },
    nextIndex: idx,
  };
}

export function promoteAppReachBlocksPortableText(blocks, keyFn = (i) => `appreach-${i}`) {
  if (!Array.isArray(blocks) || !blocks.length) return [];

  const out = [];
  for (let i = 0; i < blocks.length; ) {
    const block = blocks[i];
    if (block?._type === "appReachCard" && block.title) {
      out.push(block);
      i++;
      continue;
    }

    const grouped = tryParseAppReachGroup(blocks, i, keyFn);
    if (grouped) {
      out.push(grouped.card);
      i = grouped.nextIndex;
      continue;
    }

    out.push(block);
    i++;
  }

  return out;
}

export function isLikelyAppIconUrl(src, alt = "") {
  const s = String(src || "");
  if (APPREACH_ASSET_RE.test(s)) return false;
  if (/mzstatic\.com|play-lh\.googleusercontent\.com|googleusercontent\.com/i.test(s))
    return true;
  if (/512x512|AppIcon|app-icon/i.test(s + alt)) return true;
  return false;
}

export function parseMetaMarkdownLine(line) {
  const linkMatch =
    /\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/.exec(line);
  let appReachUrl = "";
  let appReachLabel = "アプリーチ";
  if (
    linkMatch &&
    (/app-reach|アプリーチ|mama-hack\.com/i.test(linkMatch[2]) ||
      /アプリーチ/i.test(linkMatch[1]))
  ) {
    appReachUrl = linkMatch[2];
    appReachLabel = (linkMatch[1] || "アプリーチ").trim() || "アプリーチ";
  }
  const meta = line
    .replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return { meta, appReachUrl, appReachLabel };
}

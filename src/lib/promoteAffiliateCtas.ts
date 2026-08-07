import type { PortableTextBlock } from "@portabletext/types";

/** アフィリエイト ASP / 計測ドメイン */
const AFFILIATE_HOST_RE =
  /(?:(?:www\.)?tcs-asp\.net|(?:h\.)?accesstrade\.net|(?:px\.)?a8\.net|(?:af\.)?moshimo\.com)/i;

/**
 * ボタン化する CTA 文言のみ。
 * ※ 文全体がアフィリンクでも、説明文はボタンにしない。
 */
const CTA_LABEL_RE =
  /口座開設をする|公式サイトで口座開設|で本を聴く|無料で試す|ブログを始める|お得に読む|無料で読む|聴いてみる|クレカを発行|Audibleを試す|Kindle版|kindle unlimited/i;

/** 既知パターン外でも「短い行動喚起」なら許可（説明文は長さで除外） */
const CTA_ACTION_RE = /する|試す|始める|読む|聴く|発行|申[し]?込|登録|開設/;
const CTA_MAX_LEN = 40;

const EYEBROW_TEXT_RE = /^[＼\\]\s*(.+?)\s*[／/]$/;

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

type PtBlock = PortableTextBlock & {
  _key?: string;
  style?: string;
  listItem?: string;
  children?: Span[];
  markDefs?: MarkDef[];
};

export type CustomButtonBlock = PortableTextBlock & {
  _type: "customButton";
  _key: string;
  text: string;
  url: string;
  color: string;
  glow: boolean;
  newTab: boolean;
  eyebrow?: string;
};

function isAffiliateUrl(href: string): boolean {
  return AFFILIATE_HOST_RE.test(href);
}

/** ボタン化してよいラベルか（説明文リンクは false） */
function shouldPromoteAsButton(text: string, href: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (CTA_LABEL_RE.test(t)) return true;
  // アフィ URL でも長文説明は除外。短い行動喚起のみ
  if (
    isAffiliateUrl(href) &&
    t.length <= CTA_MAX_LEN &&
    CTA_ACTION_RE.test(t) &&
    !/[。．！？!?]/.test(t)
  ) {
    return true;
  }
  return false;
}

function blockPlainText(block: PtBlock): string {
  return (block.children || []).map((c) => c.text || "").join("").trim();
}

function normalizeEyebrow(raw: string): string {
  return raw
    .replace(/\*\*/g, "")
    .replace(/^[＼\\]\s*/, "")
    .replace(/\s*[／/]$/, "")
    .trim();
}

/** 段落全体が「リンク1本だけ」なら { text, url } */
function getSoleCtaLink(
  block: PtBlock,
): { text: string; url: string } | null {
  if (block._type !== "block") return null;
  if (block.style && block.style !== "normal") return null;
  if (block.listItem) return null;

  const children = block.children || [];
  const text = blockPlainText(block);
  if (!text) return null;

  const markDefs = block.markDefs || [];
  const linkDefs = markDefs.filter((m) => m._type === "link" && m.href);
  if (linkDefs.length !== 1) return null;

  const linkKey = String(linkDefs[0]._key || "");
  const href = String(linkDefs[0].href || "");
  if (!linkKey || !href) return null;

  const allLinked = children.every((c) => {
    const t = (c.text || "").trim();
    if (!t) return true;
    return (c.marks || []).includes(linkKey);
  });
  if (!allLinked) return null;

  if (!shouldPromoteAsButton(text, href)) return null;

  return { text, url: href };
}

function isEyebrowBlock(block: PtBlock): string | null {
  if (block._type !== "block") return null;
  if (block.listItem) return null;
  if ((block.markDefs || []).some((m) => m._type === "link")) return null;
  const text = blockPlainText(block).replace(/\*\*/g, "").trim();
  const m = EYEBROW_TEXT_RE.exec(text);
  if (!m) return null;
  return normalizeEyebrow(m[1]);
}

/**
 * Sanity 上で通常リンクのまま残った単独アフィ CTA を
 * customButton ブロックへ昇格（表示側）。
 * 「Coincheckで口座開設をする」等の短い CTA のみ。説明文リンクは対象外。
 */
export function promoteAffiliateCtaBlocks(
  blocks: PortableTextBlock[] | undefined | null,
): PortableTextBlock[] {
  if (!blocks?.length) return [];

  const out: PortableTextBlock[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as PtBlock;
    const cta = getSoleCtaLink(block);
    if (!cta) {
      out.push(block);
      continue;
    }

    let eyebrow: string | undefined;
    const prev = out[out.length - 1] as PtBlock | undefined;
    if (prev) {
      const eye = isEyebrowBlock(prev);
      if (eye) {
        out.pop();
        eyebrow = eye;
      }
    }

    out.push({
      _type: "customButton",
      _key: block._key || `cta-${i}`,
      text: cta.text,
      url: cta.url,
      color: "red",
      glow: true,
      newTab: true,
      ...(eyebrow ? { eyebrow } : {}),
    } as CustomButtonBlock);
  }

  return out;
}

export function isAffiliateHref(href: string): boolean {
  return isAffiliateUrl(href);
}

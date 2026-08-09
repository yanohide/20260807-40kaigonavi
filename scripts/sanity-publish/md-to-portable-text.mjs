/**
 * Markdown → cryptoblog Sanity Portable Text
 *
 * 対応表:
 * 1. :::speech → speechBubble（左=質問者 / 右=ヤノヒデ）
 * 2. :::titled-box → titledFrame
 *    箇条書き: リード／H2直下 → band（帯付き）、H3内 → edge（帯なし）
 * 3. GFM 表 → table
 * 4. ## よくある質問 配下の ### → qaBlock
 * 5. 太字・リンク・見出し → block
 * 6. ![alt](url) → image（入稿時に Sanity asset 化。失敗時のみリンクへフォールバック）
 * 7. アフィ CTA（例: クリプタクトを無料で試す）→ customButton
 * 8. あわせて読みたい + 画像 + リンク行 → relatedArticleCard
 * 9. アプリーチ（アイコン＋アプリ名＋クレジット＋ストアバッジ）→ appReachCard
 */

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { markdownToPortableText } from "@portabletext/markdown";
import { toPlainText } from "@portabletext/toolkit";
import {
  APPREACH_META_RE,
  isLikelyAppIconUrl,
  parseMetaMarkdownLine,
  promoteAppReachBlocksPortableText,
} from "./app-reach-utils.mjs";

const key = () => randomUUID().replace(/-/g, "").slice(0, 12);

/** ローカル既定アイコン（入稿時に Sanity asset 化） */
const QUESTIONER_AVATAR_FILES = [
  "public/avatars/questioner-a.png",
  "public/avatars/questioner-b.png",
  "public/avatars/questioner-c.png",
];
const OPERATOR_AVATAR_FILE = "public/avatars/hiyoko-ninja.png";

function hashPick(seed, modulo) {
  let h = 0;
  for (let i = 0; i < String(seed).length; i++) {
    h = (h * 31 + String(seed).charCodeAt(i)) >>> 0;
  }
  return h % modulo;
}

/** 表セル Portable Text → リンク/画像/改行を残した簡易 Markdown */
function cellBlocksToMarkdown(blocks) {
  const parts = [];
  for (const block of blocks || []) {
    if (block?._type === "image") {
      const alt = String(block.alt || "");
      const src = String(block.src || block.url || block.asset?.url || "");
      if (src) parts.push(`![${alt}](${src})`);
      continue;
    }
    if (block?._type !== "block") continue;

    const markDefs = Array.isArray(block.markDefs) ? block.markDefs : [];
    const children = Array.isArray(block.children) ? block.children : [];
    const inline = [];

    for (const child of children) {
      if (child?._type === "break") {
        inline.push("<br>");
        continue;
      }
      if (child?._type !== "span") continue;

      let text = String(child.text || "");
      if (!text) continue;
      const marks = Array.isArray(child.marks) ? child.marks : [];
      const hasStrong = marks.includes("strong");
      const linkKey = marks.find((m) =>
        markDefs.some((d) => d?._key === m && d?._type === "link"),
      );
      const linkDef = linkKey
        ? markDefs.find((d) => d?._key === linkKey && d?._type === "link")
        : null;
      if (hasStrong) text = `**${text}**`;
      if (linkDef?.href) text = `[${text}](${linkDef.href})`;
      inline.push(text);
    }

    if (inline.length) parts.push(inline.join("<br>"));
  }
  return parts.join("<br>").trim();
}

function mapTableToSanityTable({ context, value }) {
  const rows = (value.rows || []).map((row) => ({
    _key: row._key || context.keyGenerator(),
    cells: (row.cells || []).map((cell) => {
      const blocks = cell.value || [];
      const rich = cellBlocksToMarkdown(blocks);
      if (rich) return rich;
      return toPlainText(blocks).replace(/\s+/g, " ").trim();
    }),
  }));
  return {
    _type: "table",
    _key: context.keyGenerator(),
    rows,
  };
}

const markdownOptions = {
  types: {
    table: mapTableToSanityTable,
    code: ({ context, value }) => ({
      _type: "block",
      _key: context.keyGenerator(),
      style: "normal",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: key(),
          text: value.code || "",
          marks: ["code"],
        },
      ],
    }),
  },
};

/** `> 引用` は通常段落にする */
function preprocessMarkdownBlockquotes(md) {
  return md.replace(/^>\s?(.*)$/gm, "$1");
}

/**
 * [![alt](img)](link) → ![alt](img)
 * 記事画像をリンク化せず image ブロックに載せやすくする（a8 は CTA 前処理で除去）。
 */
function preprocessLinkedImages(md) {
  return String(md || "").replace(
    /\[!\[([^\]]*)\]\((https?:\/\/[^)]+)\)\]\((https?:\/\/[^)]+)\)/gi,
    (_m, alt, imgUrl) => {
      if (
        isTrackingImageUrl(imgUrl) ||
        isDecorativeSkipImageUrl(imgUrl) ||
        /a8\.net/i.test(imgUrl)
      ) {
        return "";
      }
      return `![${alt}](${imgUrl})`;
    },
  );
}

/**
 * `**ラベル：**` → `**ラベル**：`
 * 全角／半角コロンが閉じ `**` の直前だと太字が壊れやすい。
 */
function preprocessBoldColons(md) {
  return String(md || "")
    .replace(/\r\n/g, "\n")
    .replace(/\*\*((?:(?!\*\*).)+?)([：:])\*\*/g, "**$1**$2");
}

/**
 * CommonMark が拾えなかったリテラル `**…**` を strong マークへ直す。
 * 開始／終了が別 span に割れている場合もあるので、block 単位で結合してから判定する。
 */
function fixLiteralBoldInBlocks(blocks) {
  function rebuildSpansFromJoined(joined, markDefs) {
    const re = /\*\*((?:(?!\*\*).)+?)\*\*/g;
    const children = [];
    let last = 0;
    let m;
    while ((m = re.exec(joined)) !== null) {
      if (m.index > last) {
        children.push({
          _type: "span",
          _key: key(),
          text: joined.slice(last, m.index),
          marks: [],
        });
      }
      children.push({
        _type: "span",
        _key: key(),
        text: m[1],
        marks: ["strong"],
      });
      last = m.index + m[0].length;
    }
    if (last < joined.length) {
      children.push({
        _type: "span",
        _key: key(),
        text: joined.slice(last),
        marks: [],
      });
    }
    return {
      children: children.length
        ? children
        : [{ _type: "span", _key: key(), text: joined, marks: [] }],
      // 結合し直すとリンク mark 参照は壊れるので、** 修正が必要なブロックでは外す
      markDefs: Array.isArray(markDefs) ? markDefs : [],
    };
  }

  function fixBlock(block) {
    if (!block || typeof block !== "object") return block;
    if (Array.isArray(block)) return block.map(fixBlock);

    if (block._type === "block" && Array.isArray(block.children)) {
      const onlySpans = block.children.every(
        (c) => !c || c._type === "span" || c._type === undefined,
      );
      const joined = block.children
        .filter((c) => c?._type === "span" && typeof c.text === "string")
        .map((c) => c.text)
        .join("");

      if (onlySpans && joined.includes("**")) {
        const rebuilt = rebuildSpansFromJoined(joined, []);
        return {
          ...block,
          children: rebuilt.children,
          markDefs: [],
        };
      }
      return block;
    }

    if (block._type === "speechBubble" && typeof block.text === "string") {
      return {
        ...block,
        text: String(block.text).replace(/\*\*((?:(?!\*\*).)+?)\*\*/g, "$1"),
      };
    }

    const next = { ...block };
    for (const [k, v] of Object.entries(next)) {
      if (k === "_type" || k === "_key") continue;
      if (Array.isArray(v) || (v && typeof v === "object")) {
        next[k] = fixBlock(v);
      }
    }
    return next;
  }

  return fixBlock(blocks);
}

/**
 * 訴求商品ごとのマイクロコピー候補。
 * variants は上から優先（直前本文・ボタン文言にマッチしたもの）。
 */
const CTA_PRODUCT_PROFILES = [
  {
    id: "cryptact",
    match: /クリプタクト|CRYPTACT|cryptact/i,
    defaultEyebrow: "平均10秒で自動損益計算",
    variants: [
      { test: /平均\s*10\s*秒|10\s*秒で/, eyebrow: "平均10秒で自動損益計算" },
      { test: /ミス|手間を省/, eyebrow: "手間を省いてミスをなくす" },
      { test: /面倒|面倒くさい/, eyebrow: "面倒な損益計算を自動化" },
      { test: /原資抜き/, eyebrow: "原資抜きの計算も自動化" },
      { test: /複雑/, eyebrow: "複雑な計算もまるっと自動化" },
      { test: /税金計算|税計算/, eyebrow: "税金計算を自動化" },
      { test: /50\s*件|年間取引/, eyebrow: "年間50件まで無料" },
      { test: /確定申告/, eyebrow: "確定申告の不安を解消" },
      { test: /NFT|DeFi/, eyebrow: "NFT・DeFiも自動識別" },
      { test: /損益計算|自動計算/, eyebrow: "損益計算を自動化" },
    ],
  },
  {
    id: "exchange",
    match:
      /口座開設|取引所|bitFlyer|ビットフライヤー|Coincheck|コインチェック|GMOコイン|bitbank|ビットバンク|BitTrade|ビットトレード|Bybit|バイビット|DMM/i,
    defaultEyebrow: "無料で口座開設",
    variants: [
      { test: /キャンペーン|特典|ボーナス/, eyebrow: "口座開設キャンペーン実施中" },
      { test: /初心者|はじめて|始め方/, eyebrow: "初心者でもかんたん口座開設" },
      { test: /手数料/, eyebrow: "手数料を抑えて始める" },
      { test: /最短|１０分|10分/, eyebrow: "最短10分で口座開設OK" },
      { test: /無料/, eyebrow: "無料で口座開設" },
    ],
  },
  {
    id: "audible",
    match: /Audible|オーディブル|audiobook/i,
    defaultEyebrow: "無料体験はこちら",
    variants: [
      { test: /無料/, eyebrow: "無料で聴いてみる" },
      { test: /オフライン/, eyebrow: "オフライン再生もOK" },
    ],
  },
  {
    id: "kindle",
    match: /Kindle|kindle unlimited/i,
    defaultEyebrow: "今すぐ読む",
    variants: [
      { test: /無料|unlimited/, eyebrow: "無料で読む" },
      { test: /お得/, eyebrow: "お得に読む" },
    ],
  },
  {
    id: "conoha",
    match: /ConoHa|コノハ|レンタルサーバー/i,
    defaultEyebrow: "ブログを始める",
    variants: [
      { test: /無料|キャンペーン/, eyebrow: "お得にサーバー契約" },
    ],
  },
  {
    id: "wallet",
    match: /ウォレット|Ledger|レジャー|Trezor|トレザー/i,
    defaultEyebrow: "資産を自分で守る",
    variants: [
      { test: /盗難|ハッキング|セキュリティ/, eyebrow: "ハッキング対策に最適" },
      { test: /初心者/, eyebrow: "初心者でも安心の保管" },
    ],
  },
];

function normalizeEyebrowText(raw) {
  return String(raw || "")
    .replace(/\*\*/g, "")
    .replace(/^[＼\\]\s*/, "")
    .replace(/\s*[／/]$/, "")
    .trim();
}

function cleanCtaLabel(label) {
  return String(label || "")
    .replace(/\*\*/g, "")
    .replace(/【|】/g, "")
    .trim();
}

function findCtaProduct(buttonText, context) {
  const haystack = `${buttonText}\n${context}`;
  return (
    CTA_PRODUCT_PROFILES.find((p) => p.match.test(buttonText)) ||
    CTA_PRODUCT_PROFILES.find((p) => p.match.test(haystack)) ||
    null
  );
}

/**
 * eyebrow 決定順:
 * 1. MD の ＼…／ が商品の既定ストック文言以外 → 著者指定として優先
 * 2. 直前本文＋ボタン文言から商品別 variants を判定
 * 3. 商品の defaultEyebrow
 * 4. 不明商品 → 空（ボタンのみ）
 */
function resolveCtaEyebrow({ buttonText, context, explicit }) {
  const product = findCtaProduct(buttonText, context);
  const eye = normalizeEyebrowText(explicit);

  if (eye && (!product || eye !== product.defaultEyebrow)) {
    return eye;
  }

  if (!product) return eye || "";

  const haystack = `${context}\n${buttonText}`;
  for (const variant of product.variants) {
    if (variant.test.test(haystack)) return variant.eyebrow;
  }
  return product.defaultEyebrow;
}

function buildCtaFence({ text, url, eyebrow }) {
  const lines = [
    "",
    ":::cta",
    `text: ${text}`,
    `url: ${url}`,
    "color: red",
    "glow: true",
  ];
  if (eyebrow) lines.push(`eyebrow: ${eyebrow}`);
  lines.push(":::", "");
  return lines.join("\n");
}

const EYEBROW_LINE_RE = /^(?:\*\*)?[＼\\]\s*([^／\n/]+?)\s*[／/](?:\*\*)?\s*$/;
const CTA_STANDALONE_LINK_RE = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*$/;
const CTA_AFF_HOST_RE =
  /(?:(?:www\.)?tcs-asp\.net|(?:h\.)?accesstrade\.net|(?:px\.)?a8\.net|(?:af\.)?moshimo\.com)/i;
const CTA_LABEL_RE =
  /口座開設をする|公式サイトで口座開設|で本を聴く|無料で試す|ブログを始める|お得に読む|無料で読む|聴いてみる|クレカを発行|Audibleを試す|Kindle版|kindle unlimited/i;

/** 単独行リンクが短い CTA なら [label, url]、でなければ null */
function matchCtaStandaloneLink(line) {
  const m = CTA_STANDALONE_LINK_RE.exec(String(line || "").trim());
  if (!m) return null;
  const label = String(m[1] || "").replace(/\*\*/g, "").trim();
  const url = m[2];
  if (CTA_LABEL_RE.test(label)) return m;
  // アフィ URL でも長文説明は除外（ボタン化しない）
  if (
    CTA_AFF_HOST_RE.test(url) &&
    label.length <= 40 &&
    /する|試す|始める|読む|聴く|発行|申[し]?込|登録|開設/.test(label) &&
    !/[。．！？!?]/.test(label)
  ) {
    return m;
  }
  return null;
}

/** 毎回同じアフィ定型文（文脈判定を汚染するので除外） */
const AFFILIATE_BOILERPLATE_RE =
  /業界No\.?\s*1の利用者数|税理士も信頼するサービス|NFTやDeFi取引も自動識別|対応通貨数/;

function isIgnorableContextLine(line) {
  const t = String(line || "").trim();
  if (!t) return true;
  if (EYEBROW_LINE_RE.test(t)) return true;
  if (matchCtaStandaloneLink(t)) return true;
  if (/^#{1,6}\s/.test(t)) return true;
  if (/^:::{1,3}/.test(t)) return true;
  if (/^[-*_]{3,}$/.test(t)) return true;
  if (AFFILIATE_BOILERPLATE_RE.test(t)) return true;
  return false;
}

/**
 * CTA 直前の訴求段落を文脈として拾う（アフィ定型文は除外）。
 * 直近1段落を優先し、短すぎる場合のみもう1段落を足す。
 */
function collectCtaContext(lines, index) {
  const chunks = [];
  for (let i = index - 1; i >= 0 && chunks.length < 2; i--) {
    const line = lines[i].trim();
    if (isIgnorableContextLine(line)) continue;
    const plain = line
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*/g, "")
      .replace(/`+/g, "")
      .trim();
    if (!plain) continue;
    chunks.unshift(plain);
    // 直近段落が十分ながければそれで判定（上の段落の語に引っ張られない）
    if (chunks.length === 1 && plain.length >= 40) break;
  }
  return chunks.join("\n");
}

/**
 * アフィリエイト CTA を :::cta フェンスへ。
 * バナー／計測ピクセルは除去し、eyebrow は本文・商品に応じて決定。
 */
/**
 * あわせて読みたい
 * ![](thumb)
 * [タイトル](url) 抜粋…
 * → :::related-card
 */
function preprocessRelatedArticleCards(md) {
  const LABEL_RE = /^(?:\*\*)?あわせて読みたい(?:\*\*)?\s*$/;
  const IMG_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/;
  const LINK_RE = /^\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]*)\)\s*(.*)$/;

  const lines = String(md || "")
    .replace(/\r\n/g, "\n")
    .split("\n");
  const result = [];
  let i = 0;

  while (i < lines.length) {
    if (!LABEL_RE.test(lines[i].trim())) {
      result.push(lines[i]);
      i++;
      continue;
    }

    let j = i + 1;
    while (j < lines.length && !String(lines[j]).trim()) j++;
    const imgMatch = IMG_RE.exec(String(lines[j] || "").trim());
    if (!imgMatch) {
      result.push(lines[i]);
      i++;
      continue;
    }

    let k = j + 1;
    while (k < lines.length && !String(lines[k]).trim()) k++;
    const linkMatch = LINK_RE.exec(String(lines[k] || "").trim());
    if (!linkMatch) {
      result.push(lines[i]);
      i++;
      continue;
    }

    const title = linkMatch[1].trim();
    const url = linkMatch[2].trim();
    const excerpt = linkMatch[3]
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const imageSrc = imgMatch[2].trim();

    result.push(
      ":::related-card",
      `title: ${title}`,
      `url: ${url}`,
      `image: ${imageSrc}`,
      "label: あわせて読みたい",
      "",
      excerpt,
      ":::",
      "",
    );
    i = k + 1;
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n");
}

function extractStorePairs(line) {
  const out = [];
  const re = /\[!\[[^\]]*\]\(([^)]+)\)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(String(line))) !== null) {
    out.push({ imageSrc: m[1].trim(), url: m[2].trim() });
  }
  return out;
}

/**
 * WP「アプリーチ」ブロックを :::app-reach フェンスへ。
 * 任意: アイコン画像 → アプリ名 → クレジット行 → ストアバッジ（1行または複数行）
 */
function preprocessAppReachCards(md) {
  const IMG_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*$/;

  const lines = String(md || "")
    .replace(/\r\n/g, "\n")
    .split("\n");
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!APPREACH_META_RE.test(line)) {
      result.push(line);
      i++;
      continue;
    }

    const metaLine = line.trim();
    let j = i - 1;
    while (j >= 0 && !String(lines[j]).trim()) j--;

    let titleLine = "";
    let iconSrc = "";
    let iconAlt = "";

    if (j >= 0) {
      const atMeta = String(lines[j]).trim();
      const imgAtMeta = IMG_RE.exec(atMeta);
      if (imgAtMeta && isLikelyAppIconUrl(imgAtMeta[2], imgAtMeta[1])) {
        iconSrc = imgAtMeta[2].trim();
        iconAlt = imgAtMeta[1].trim();
        titleLine = iconAlt;
      } else if (
        atMeta &&
        !atMeta.startsWith("#") &&
        !atMeta.startsWith(":::") &&
        !APPREACH_META_RE.test(atMeta) &&
        extractStorePairs(atMeta).length === 0
      ) {
        titleLine = atMeta;
        j--;
        while (j >= 0 && !String(lines[j]).trim()) j--;
        if (j >= 0) {
          const above = String(lines[j]).trim();
          const imgAbove = IMG_RE.exec(above);
          if (imgAbove && isLikelyAppIconUrl(imgAbove[2], imgAbove[1])) {
            iconSrc = imgAbove[2].trim();
            iconAlt = imgAbove[1].trim();
          }
        }
      }
    }

    let k = i + 1;
    while (k < lines.length && !String(lines[k]).trim()) k++;
    const stores = [];
    while (k < lines.length) {
      const pairs = extractStorePairs(String(lines[k]).trim());
      if (!pairs.length) break;
      stores.push(...pairs);
      k++;
    }

    if (!titleLine) {
      result.push(line);
      i++;
      continue;
    }

    const { meta, appReachUrl, appReachLabel } =
      parseMetaMarkdownLine(metaLine);

    result.push(
      ":::app-reach",
      `title: ${titleLine}`,
      `meta: ${meta}`,
      ...(appReachUrl ? [`appReachUrl: ${appReachUrl}`] : []),
      ...(appReachLabel ? [`appReachLabel: ${appReachLabel}`] : []),
      ...(iconSrc ? [`icon: ${iconSrc}`, `iconAlt: ${iconAlt || titleLine}`] : []),
      ...stores.map((s) => `store: ${s.imageSrc}|${s.url}`),
      ":::",
      "",
    );
    i = k;
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n");
}

function preprocessAffiliateCtas(md) {
  let out = md.replace(/\r\n/g, "\n");

  // [![banner](a8|tcs-asp...)](aff...) 形式
  out = out.replace(
    /\[!\[[^\]]*\]\(https?:\/\/[^)]*(?:a8\.net|tcs-asp\.net|moshimo\.com|accesstrade\.net)[^)]*\)\]\(https?:\/\/[^)]+\)/gi,
    "",
  );
  // 単独の計測・バナー画像
  out = out.replace(
    /!\[[^\]]*\]\(https?:\/\/[^)]*(?:a8\.net|tcs-asp\.net\/imagesender|moshimo\.com)[^)]*\)/gi,
    "",
  );

  const lines = out.split("\n");
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const linkMatch = matchCtaStandaloneLink(trimmed);
    if (!linkMatch) {
      result.push(line);
      continue;
    }

    const text = cleanCtaLabel(linkMatch[1]);
    const url = linkMatch[2];

    let explicit = "";
    // 直前の空行を飛ばして ＼…／ があれば著者指定候補
    let j = result.length - 1;
    while (j >= 0 && !String(result[j]).trim()) j--;
    if (j >= 0) {
      const eyeMatch = EYEBROW_LINE_RE.exec(String(result[j]).trim());
      if (eyeMatch) {
        explicit = eyeMatch[1];
        result.splice(j, result.length - j); // 空行ごと除去
      }
    }

    const context = collectCtaContext(lines, i);
    const eyebrow = resolveCtaEyebrow({
      buttonText: text,
      context,
      explicit,
    });
    result.push(buildCtaFence({ text, url, eyebrow }).replace(/^\n/, ""));
  }

  out = result.join("\n");
  // 使い残しの ＼ ／ 行を除去
  out = out.replace(/^(?:\*\*)?[＼\\]\s*[^／\n/]+?\s*[／/](?:\*\*)?\s*$/gm, "");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out;
}

const LIST_ITEM_RE = /^(\s*[-*+]|\s*\d+\.)\s+/;
const BOLD_TITLE_LINE_RE = /^\*\*([^*]+)\*\*\s*$/;
const IMAGE_LINE_RE = /^!\[|^\[!\[/;
const SERVICE_PROMO_TITLE_RE =
  /^\s*(?:\*\*)?(.+?のおすすめポイント)(?:\*\*)?\s*$/;
const DETAIL_LINK_RE = /^\[詳しい内容を見る\]\(([^)]+)\)\s*$/;
const OFFICIAL_LINK_RE = /^\[公式サイトを見る\]\(([^)]+)\)\s*$/;
const PLAIN_DETAIL_RE = /^詳しい内容を見る\s*$/;
const PLAIN_OFFICIAL_RE = /^公式サイトを見る\s*$/;

function isListItemLine(line) {
  return LIST_ITEM_RE.test(String(line || ""));
}

function isListContinuationLine(line) {
  return /^\s{2,}\S/.test(String(line || ""));
}

function stripMdInline(text) {
  return String(text || "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/`+/g, "")
    .replace(/^#{1,6}\s+/, "")
    .trim();
}

function collectListBlock(lines, start) {
  const listLines = [];
  let j = start;
  while (j < lines.length) {
    const line = lines[j];
    if (!line.trim()) {
      let k = j + 1;
      while (k < lines.length && !lines[k].trim()) k++;
      if (
        k < lines.length &&
        (isListItemLine(lines[k]) || isListContinuationLine(lines[k]))
      ) {
        listLines.push(line);
        j++;
        continue;
      }
      break;
    }
    if (isListItemLine(line) || isListContinuationLine(line)) {
      listLines.push(line);
      j++;
      continue;
    }
    break;
  }
  return { listLines, end: j };
}

/**
 * 「◯◯のおすすめポイント」＋アイコン＋リスト＋2リンク → servicePromoCard フェンス。
 * preprocessEdgeListFrames より前に実行し、囲み枠リストへ二重変換しない。
 */
function preprocessServicePromoCards(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let fenceDepth = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (/^:::[a-zA-Z]/.test(trimmed)) {
      fenceDepth++;
      out.push(lines[i]);
      i++;
      continue;
    }
    if (fenceDepth > 0 && /^:::\s*$/.test(trimmed)) {
      fenceDepth = Math.max(0, fenceDepth - 1);
      out.push(lines[i]);
      i++;
      continue;
    }
    if (fenceDepth > 0) {
      out.push(lines[i]);
      i++;
      continue;
    }

    const titleMatch = SERVICE_PROMO_TITLE_RE.exec(trimmed);
    if (!titleMatch) {
      out.push(lines[i]);
      i++;
      continue;
    }

    const title = titleMatch[1].trim();
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;

    const imgLine = j < lines.length ? String(lines[j]).trim() : "";
    const imgMatch = imgLine.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (!imgMatch) {
      out.push(lines[i]);
      i++;
      continue;
    }
    const iconAlt = imgMatch[1].replace(/\\_/g, "_").trim();
    const iconUrl = imgMatch[2].trim();
    j++;
    while (j < lines.length && !lines[j].trim()) j++;

    if (j >= lines.length || !isListItemLine(lines[j])) {
      out.push(lines[i]);
      i++;
      continue;
    }

    const { listLines, end: listEnd } = collectListBlock(lines, j);
    j = listEnd;
    while (j < lines.length && !lines[j].trim()) j++;

    let detailUrl = "";
    let officialUrl = "";
    let linkEnd = j;
    while (linkEnd < lines.length) {
      const lt = String(lines[linkEnd]).trim();
      if (!lt) {
        linkEnd++;
        continue;
      }
      const detail = DETAIL_LINK_RE.exec(lt);
      if (detail) {
        detailUrl = detail[1].trim();
        linkEnd++;
        continue;
      }
      const official = OFFICIAL_LINK_RE.exec(lt);
      if (official) {
        officialUrl = official[1].trim();
        linkEnd++;
        continue;
      }
      if (PLAIN_DETAIL_RE.test(lt)) {
        linkEnd++;
        continue;
      }
      if (PLAIN_OFFICIAL_RE.test(lt)) {
        linkEnd++;
        continue;
      }
      break;
    }

    if (!detailUrl && officialUrl) detailUrl = officialUrl;
    if (!officialUrl && detailUrl) officialUrl = detailUrl;
    if (!detailUrl) {
      out.push(lines[i]);
      i++;
      continue;
    }

    out.push(
      ":::service-promo",
      `title: ${title}`,
      `icon: ${iconUrl}`,
      ...(iconAlt ? [`iconAlt: ${iconAlt}`] : []),
      `detailUrl: ${detailUrl}`,
      `officialUrl: ${officialUrl}`,
      "",
      ...listLines,
      ":::",
      "",
    );
    i = linkEnd;
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

function shortenTitle(raw, max = 28) {
  let t = stripMdInline(raw)
    .replace(/[。．.]+$/g, "")
    .replace(/^(なお|また|つまり|ここでは|ここからは)/, "")
    .trim();
  if (!t) return "";
  if (t.length > max) t = `${t.slice(0, max - 1)}…`;
  return t;
}

/**
 * 箇条書きタイトル決定:
 * 1. 直前の **タイトル**（画像を挟んでも可）→ その行を本文から除去
 * 2. 直前の見出し
 * 3. 短い直前文
 * 4. リスト内容からの推定
 * 5. フォールバック「ポイント」
 */
function resolveListFrameTitle(out, listLines) {
  let idx = out.length - 1;
  while (idx >= 0 && !String(out[idx]).trim()) idx--;

  // 画像・空行をスキップして直前の文脈を見る（画像は残す）
  let probe = idx;
  while (probe >= 0 && IMAGE_LINE_RE.test(String(out[probe]).trim())) {
    probe--;
    while (probe >= 0 && !String(out[probe]).trim()) probe--;
  }

  const probeLine = probe >= 0 ? String(out[probe]).trim() : "";
  const bold = BOLD_TITLE_LINE_RE.exec(probeLine);
  if (bold) {
    const title = bold[1].trim();
    if (
      title &&
      title.length <= 60 &&
      !title.includes("＼") &&
      !title.includes("／")
    ) {
      return { title, removeOutIndex: probe };
    }
  }

  const heading = /^(#{1,6})\s+(.+)$/.exec(probeLine);
  if (heading) {
    const title = shortenTitle(heading[2], 28);
    if (title) return { title, removeOutIndex: -1 };
  }

  const itemTexts = listLines
    .filter(isListItemLine)
    .map((l) => stripMdInline(l.replace(LIST_ITEM_RE, "")))
    .filter(Boolean);

  // 「下記の通り」系の長文はタイトルに使わず、リスト内容から推定する
  if (
    probeLine &&
    !isListItemLine(probeLine) &&
    !IMAGE_LINE_RE.test(probeLine) &&
    !/^:::/.test(probeLine) &&
    !/(下記|次の|つぎの|以下|通り|とおり)/.test(probeLine)
  ) {
    const plain = stripMdInline(probeLine);
    if (plain.length > 0 && plain.length <= 24) {
      return { title: plain, removeOutIndex: -1 };
    }
  }

  if (itemTexts.some((t) => /単価/.test(t))) {
    return { title: "単価の計算", removeOutIndex: -1 };
  }
  if (itemTexts.some((t) => /取引\s*（?\d+回目/.test(t))) {
    return { title: "取引の内訳", removeOutIndex: -1 };
  }
  if (
    itemTexts.length > 0 &&
    itemTexts.length <= 6 &&
    itemTexts.every((t) => t.length <= 16)
  ) {
    return { title: "一覧", removeOutIndex: -1 };
  }

  return { title: "ポイント", removeOutIndex: -1 };
}

/**
 * 見出しコンテキストから帯スタイルを決める。
 * - lead（最初の H2 より前）／H2 直下セクション → band（タイトル帯付き）
 * - H3 以降のセクション内 → edge（タイトル帯なし・上辺挟み）
 */
function listFrameStyleForHeadingLevel(headingLevel) {
  return headingLevel >= 3 ? "edge" : "band";
}

/**
 * トップレベルの箇条書き／番号リストを titledFrame へ正規化。
 * スタイルはリード・見出し階層で切り替え。
 */
function preprocessEdgeListFrames(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let fenceDepth = 0;
  /** 0=リード, 2=H2配下, 3+=H3配下 */
  let headingLevel = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (/^:::[a-zA-Z]/.test(trimmed)) {
      fenceDepth++;
      out.push(lines[i]);
      i++;
      continue;
    }
    if (fenceDepth > 0 && /^:::\s*$/.test(trimmed)) {
      fenceDepth = Math.max(0, fenceDepth - 1);
      out.push(lines[i]);
      i++;
      continue;
    }
    if (fenceDepth > 0) {
      out.push(lines[i]);
      i++;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (level === 2) headingLevel = 2;
      else if (level >= 3) headingLevel = level;
      out.push(lines[i]);
      i++;
      continue;
    }

    if (isListItemLine(lines[i])) {
      const { listLines, end } = collectListBlock(lines, i);
      if (listLines.some(isListItemLine)) {
        // `<!-- plain-list -->` 直下のリストは囲み枠にせず素の箇条書きのまま残す
        let plainProbe = out.length - 1;
        while (plainProbe >= 0 && !String(out[plainProbe]).trim()) plainProbe--;
        if (
          plainProbe >= 0 &&
          /^<!--\s*plain-list\s*-->$/.test(String(out[plainProbe]).trim())
        ) {
          out.splice(plainProbe, out.length - plainProbe);
          while (out.length && !String(out[out.length - 1]).trim()) out.pop();
          out.push(...listLines, "");
          i = end;
          continue;
        }

        const { title, removeOutIndex } = resolveListFrameTitle(out, listLines);
        if (removeOutIndex >= 0) {
          // タイトル行とその直後〜リスト直前の余剰空行のみ除去（画像は残す）
          let cutEnd = removeOutIndex + 1;
          while (cutEnd < out.length && !String(out[cutEnd]).trim()) cutEnd++;
          if (cutEnd < out.length && IMAGE_LINE_RE.test(String(out[cutEnd]).trim())) {
            out.splice(removeOutIndex, cutEnd - removeOutIndex);
          } else {
            out.splice(removeOutIndex, out.length - removeOutIndex);
          }
          while (out.length && !String(out[out.length - 1]).trim()) out.pop();
        }

        const style = listFrameStyleForHeadingLevel(headingLevel);
        out.push(
          ":::titled-box",
          `title: ${title}`,
          `style: ${style}`,
          "",
          ...listLines,
          ":::",
          "",
        );
        i = end;
        continue;
      }
    }

    out.push(lines[i]);
    i++;
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

function splitFences(md) {
  const segments = [];
  const re = /:::([\w-]+)\s*\n([\s\S]*?)\r?\n:::/g;
  let last = 0;
  let m;
  while ((m = re.exec(md)) !== null) {
    if (m.index > last) {
      segments.push({ type: "md", content: md.slice(last, m.index) });
    }
    segments.push({ type: "fence", kind: m[1], inner: m[2] });
    last = m.index + m[0].length;
  }
  if (last < md.length) {
    segments.push({ type: "md", content: md.slice(last) });
  }
  return segments;
}

function parseMetaBody(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const meta = {};
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      break;
    }
    const kv = /^([a-zA-Z0-9_]+)\s*:\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].trim();
    else break;
  }
  const body = lines.slice(i).join("\n").replace(/^\n+/, "").trimEnd();
  return { meta, body: body.trim() };
}

/**
 * `==蛍光マーカー==` → Portable Text の highlight デコレータ。
 * 内部の **太字** や [リンク](url) も別 chunk として解釈する。
 */
function parseHighlightInner(inner) {
  let blocks = markdownToPortableText(String(inner || "").trim(), markdownOptions);
  blocks = fixLiteralBoldInBlocks(blocks);
  const children = [];
  const markDefs = [];
  for (const block of blocks) {
    if (block?._type !== "block" || (block.style && block.style !== "normal")) {
      continue;
    }
    for (const child of block.children || []) {
      if (child?._type !== "span") continue;
      children.push({
        ...child,
        _key: key(),
        marks: [...(child.marks || []), "highlight"],
      });
    }
    for (const def of block.markDefs || []) {
      if (!markDefs.some((d) => d._key === def._key)) markDefs.push(def);
    }
  }
  return { children, markDefs };
}

function applyHighlightPlaceholders(blocks, highlightSegments) {
  if (!highlightSegments.length) return blocks;

  function fixBlock(block) {
    if (!block || typeof block !== "object") return block;
    if (Array.isArray(block)) return block.map(fixBlock);

    if (block._type === "block" && Array.isArray(block.children)) {
      const joined = block.children
        .filter((c) => c?._type === "span")
        .map((c) => c.text || "")
        .join("");
      if (!/⟦hl:\d+⟧/.test(joined)) return block;

      const re = /⟦hl:(\d+)⟧/g;
      const newChildren = [];
      const newMarkDefs = [...(block.markDefs || [])];
      let last = 0;
      let m;
      while ((m = re.exec(joined)) !== null) {
        if (m.index > last) {
          newChildren.push({
            _type: "span",
            _key: key(),
            text: joined.slice(last, m.index),
            marks: [],
          });
        }
        const inner = highlightSegments[Number(m[1])];
        if (inner) {
          const parsed = parseHighlightInner(inner);
          newChildren.push(...parsed.children);
          for (const def of parsed.markDefs) {
            if (!newMarkDefs.some((d) => d._key === def._key)) {
              newMarkDefs.push(def);
            }
          }
        }
        last = m.index + m[0].length;
      }
      if (last < joined.length) {
        newChildren.push({
          _type: "span",
          _key: key(),
          text: joined.slice(last),
          marks: [],
        });
      }
      return { ...block, children: newChildren, markDefs: newMarkDefs };
    }

    const next = { ...block };
    for (const [k, v] of Object.entries(next)) {
      if (k === "_type" || k === "_key") continue;
      if (Array.isArray(v) || (v && typeof v === "object")) {
        next[k] = fixBlock(v);
      }
    }
    return next;
  }

  return fixBlock(blocks);
}

function convertMdChunk(text) {
  const chunk = (text || "").trim();
  if (!chunk) return [];

  const highlightSegments = [];
  const processed = chunk.replace(/==([\s\S]+?)==/g, (_, inner) => {
    const idx = highlightSegments.length;
    highlightSegments.push(inner.trim());
    return `⟦hl:${idx}⟧`;
  });

  let blocks = markdownToPortableText(processed, markdownOptions);
  if (highlightSegments.length) {
    blocks = applyHighlightPlaceholders(blocks, highlightSegments);
  }
  return blocks;
}

function titledFrameBodyFromMd(md) {
  return convertMdChunk(md).map((b) => {
    if (b?._type === "block" && b.style && b.style !== "normal") {
      return { ...b, style: "normal" };
    }
    return b;
  });
}

/**
 * 吹き出しルール:
 * - 左 = 質問者 / 右 = ひよこ忍者
 * MD の speaker（悩む人・案内 等）と文面から判定する。
 * ※ wp-to-md はほぼ side:left のため、案内＋left は文面ヒューリスティックで分ける。
 */
function resolveSpeechRole(rawSpeaker, rawSide, text) {
  const speaker = String(rawSpeaker || "").trim();
  const side = String(rawSide || "").trim().toLowerCase();
  const t = String(text || "");

  if (speaker === "ひよこ忍者" || speaker === "ヤノヒデ" || side === "right") {
    return { speaker: "ひよこ忍者", position: "right" };
  }
  if (speaker === "質問者" || speaker === "悩む人") {
    return { speaker: "質問者", position: "left" };
  }

  const looksLikeQuestion =
    /[？?]/.test(t) ||
    /知りたい|教えて|むずかし|難し|分から|わから|できない|なりそう|すぎる/.test(
      t,
    );

  if (looksLikeQuestion) {
    return { speaker: "質問者", position: "left" };
  }
  return { speaker: "ひよこ忍者", position: "right" };
}

function fenceToBlocks(kind, inner) {
  const k = kind.toLowerCase();

  if (k === "speech" || k === "speech-balloon") {
    const { meta, body } = parseMetaBody(inner);
    const text = body || inner.trim();
    const role = resolveSpeechRole(meta.speaker, meta.side, text);
    return [
      {
        _type: "speechBubble",
        _key: key(),
        speaker: role.speaker,
        text,
        position: role.position,
      },
    ];
  }

  if (k === "titled-box" || k === "titledbox") {
    const { meta, body } = parseMetaBody(inner);
    const title = meta.title?.trim() || "枠タイトル";
    const style = meta.style === "edge" ? "edge" : "band";
    const avatarRaw = String(meta.avatar || meta.icon || "").trim();
    const avatarCaption = String(
      meta.avatarCaption || meta.caption || meta.name || "",
    ).trim();
    let avatarSrc = "";
    if (avatarRaw) {
      if (
        /^(yanohide|hiyoko-ninja|ヤノヒデ|ひよこ忍者)$/i.test(avatarRaw) ||
        avatarRaw === OPERATOR_AVATAR_FILE
      ) {
        avatarSrc = OPERATOR_AVATAR_FILE;
      } else {
        avatarSrc = avatarRaw;
      }
    }
    return [
      {
        _type: "titledFrame",
        _key: key(),
        title,
        style,
        body: titledFrameBodyFromMd(body),
        ...(avatarSrc ? { avatarSrc } : {}),
        ...(avatarCaption ? { avatarCaption } : {}),
      },
    ];
  }

  if (k === "related-card" || k === "related-article" || k === "blog-card") {
    const { meta, body } = parseMetaBody(inner);
    const title = (meta.title || "").trim();
    const url = (meta.url || meta.href || "").trim();
    if (!title || !url) return convertMdChunk(inner);
    const excerpt = (meta.excerpt || body || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const label = (meta.label || "あわせて読みたい").trim();
    const imageSrc = (meta.image || meta.imageSrc || meta.src || "").trim();
    return [
      {
        _type: "relatedArticleCard",
        _key: key(),
        title,
        url,
        label,
        excerpt,
        ...(imageSrc ? { imageSrc } : {}),
      },
    ];
  }

  if (k === "app-reach" || k === "appreach" || k === "app-reach-card") {
    const meta = {};
    const stores = [];
    for (const line of inner.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const storeMatch = /^store:\s*(.+)$/i.exec(trimmed);
      if (storeMatch) {
        const parts = storeMatch[1].split("|").map((s) => s.trim());
        stores.push({ imageSrc: parts[0] || "", url: parts[1] || "" });
        continue;
      }
      const kv = /^([\w-]+)\s*:\s*(.*)$/.exec(trimmed);
      if (kv) meta[kv[1]] = kv[2].trim();
    }
    const title = (meta.title || "").trim();
    const metaText = (meta.meta || "").trim();
    if (!title || !metaText) return convertMdChunk(inner);
    return [
      {
        _type: "appReachCard",
        _key: key(),
        title,
        meta: metaText,
        appReachLabel: (meta.appReachLabel || "アプリーチ").trim(),
        ...(meta.appReachUrl ? { appReachUrl: meta.appReachUrl.trim() } : {}),
        ...(meta.icon
          ? {
              iconSrc: meta.icon.trim(),
              iconAlt: (meta.iconAlt || title).trim(),
            }
          : {}),
        ...(stores.length ? { storeBadges: stores } : {}),
      },
    ];
  }

  if (k === "service-promo" || k === "servicepromo") {
    const { meta, body } = parseMetaBody(inner);
    const title = (meta.title || "おすすめポイント").trim();
    const detailUrl = (meta.detailUrl || meta.detailurl || "").trim();
    const officialUrl = (meta.officialUrl || meta.officialurl || "").trim();
    if (!detailUrl || !officialUrl) return convertMdChunk(inner);
    return [
      {
        _type: "servicePromoCard",
        _key: key(),
        title,
        iconSrc: (meta.icon || "").trim(),
        iconAlt: (meta.iconAlt || meta.iconalt || title).trim(),
        detailUrl,
        officialUrl,
        points: titledFrameBodyFromMd(body),
      },
    ];
  }

  if (k === "cta" || k === "button" || k === "custom-button") {
    const { meta, body } = parseMetaBody(inner);
    const text = (meta.text || body || "詳しくはこちら").trim();
    const url = (meta.url || meta.href || "").trim();
    if (!url) return convertMdChunk(inner);
    const color = [
      "navy",
      "red",
      "blue",
      "green",
      "gold",
      "burgundy",
      "outline",
    ].includes(meta.color)
      ? meta.color
      : "navy";
    const glow =
      meta.glow === "true" || meta.glow === "1" || meta.glow === true;
    const eyebrow = normalizeEyebrowText(meta.eyebrow);
    return [
      {
        _type: "customButton",
        _key: key(),
        text,
        url,
        color,
        glow,
        newTab: meta.newTab !== "false",
        ...(eyebrow ? { eyebrow } : {}),
      },
    ];
  }

  if (k === "accordion" || k === "accordion-block") {
    const { meta, body } = parseMetaBody(inner);
    const title = (meta.title || "").trim() || "アコーディオン";
    // ネストした :::speech / :::titled-box も再帰的に変換
    const nested = [];
    for (const seg of splitFences(body)) {
      if (seg.type === "md") nested.push(...convertMdChunk(seg.content));
      else nested.push(...fenceToBlocks(seg.kind, seg.inner));
    }
    return [
      {
        _type: "accordionBlock",
        _key: key(),
        title,
        body: nested,
      },
    ];
  }

  return convertMdChunk(inner);
}

/** メリット比較など、指定 H3 をアコーディオンへ（閉じた状態が初期） */
const DEFAULT_ACCORDION_H3_TITLES = new Set([
  "緊急通報型",
  "センサー型",
  "カメラ型",
  "自宅訪問型",
  "電話・アプリ型",
  "安否確認型",
  "緊急通報型：２社",
  "センサー型：4社",
  "カメラ型：3社",
  "自宅訪問型：3社",
  "電話・アプリ型：2社",
  "安否確認型：４社",
  "① 親の希望を理解する",
  "②緊急時のサポートを確認する",
  "③健康状態に合ったものを選ぶ",
  "④プライバシーを十分に考慮する",
  "⑤使いやすさをチェックする",
  "⑥無理のない予算で選ぶ",
]);

function extractNamedH3Accordions(blocks, titles = DEFAULT_ACCORDION_H3_TITLES) {
  if (!blocks?.length) return [];
  const out = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (isHeading(block, "h3")) {
      const title = blockPlainText(block);
      if (titles.has(title)) {
        const body = [];
        i += 1;
        while (i < blocks.length) {
          const next = blocks[i];
          if (isHeading(next, "h2") || isHeading(next, "h3")) break;
          body.push(next);
          i += 1;
        }
        out.push({
          _type: "accordionBlock",
          _key: block._key || key(),
          title,
          body,
        });
        continue;
      }
    }
    out.push(block);
    i += 1;
  }
  return out;
}

function blockPlainText(block) {
  if (!block) return "";
  if (block._type === "block") return toPlainText([block]).trim();
  return "";
}

function isHeading(block, style) {
  return block?._type === "block" && block.style === style;
}

function isFaqH2(block) {
  if (!isHeading(block, "h2")) return false;
  const t = blockPlainText(block).replace(/\s+/g, "");
  return (
    t.includes("よくある質問") ||
    t.includes("質問と回答") ||
    t.includes("Q&A") ||
    t.includes("Q＆A")
  );
}

function normalizeAnswerBlocks(blocks) {
  return (blocks || []).map((b) => {
    if (b?._type === "block" && b.style === "blockquote") {
      return { ...b, style: "normal" };
    }
    return b;
  });
}

/** ## よくある質問 … 次の ## までを qaBlock にまとめる */
function extractQaBlocks(blocks) {
  const out = [];
  let i = 0;

  while (i < blocks.length) {
    if (!isFaqH2(blocks[i])) {
      out.push(blocks[i]);
      i++;
      continue;
    }

    // FAQ 見出し（H2）は残す。Q&A 本体だけ qaBlock にまとめる
    out.push(blocks[i]);
    i++;
    const prelude = [];
    while (
      i < blocks.length &&
      !isHeading(blocks[i], "h2") &&
      !isHeading(blocks[i], "h3")
    ) {
      prelude.push(blocks[i]);
      i++;
    }

    const items = [];
    while (i < blocks.length && !isHeading(blocks[i], "h2")) {
      if (isHeading(blocks[i], "h3")) {
        const question = blockPlainText(blocks[i]).replace(/^\*+|\*+$/g, "").trim();
        i++;
        const answer = [];
        while (
          i < blocks.length &&
          !isHeading(blocks[i], "h2") &&
          !isHeading(blocks[i], "h3")
        ) {
          answer.push(blocks[i]);
          i++;
        }
        items.push({
          _key: key(),
          question: question || "（質問）",
          summary: "",
          answer: normalizeAnswerBlocks(answer),
        });
        continue;
      }
      if (items.length) {
        items[items.length - 1].answer.push(blocks[i]);
      } else {
        prelude.push(blocks[i]);
      }
      i++;
    }

    out.push(...prelude);
    if (items.length) {
      out.push({
        _type: "qaBlock",
        _key: key(),
        items,
      });
    }
  }

  return out;
}

function isTrackingImageUrl(href) {
  return /\/0\.gif(?:\?|$)/i.test(href) || /a8\.net\/svt\/bgt/i.test(href);
}

/** WP装飾用の小さいイラスト・吹き出しアイコン等（本文フル幅画像にしない） */
function isDecorativeSkipImageUrl(href) {
  const s = String(href || "");
  return (
    /fukidashi\.(png|jpe?g|webp|gif)(?:\?|$)/i.test(s) ||
    /-150x150\.(?:png|jpe?g|webp|gif)(?:\?|$)/i.test(s) ||
    /\/kaisya_[^/]+\.(?:png|jpe?g|webp|gif)(?:\?|$)/i.test(s) ||
    /\/questioner-[abc]\.(?:png|jpe?g|webp)(?:\?|$)/i.test(s) ||
    /\/avatars\/questioner/i.test(s) ||
    // WP吹き出しアバター（正規化漏れ時のフル幅表示ガード）
    /\/0e37988b05569bdda6b691366edcd517(?:-\d+x\d+)?\.png(?:\?|$)/i.test(s) ||
    /\/795316b92fc766b0181f6fef074f03fa(?:-\d+)?(?:-\d+x\d+)?\.png(?:\?|$)/i.test(
      s,
    )
  );
}

function externalImageToLinkBlock(image) {
  const href = String(image.src);
  if (isTrackingImageUrl(href)) return null;
  const label = (image.alt || href).trim() || href;
  const markKey = key();
  return {
    _type: "block",
    _key: key(),
    style: "normal",
    markDefs: [{ _type: "link", _key: markKey, href }],
    children: [
      {
        _type: "span",
        _key: key(),
        text: label,
        marks: [markKey],
      },
    ],
  };
}

function imageSrcOf(node) {
  if (!node || typeof node !== "object") return "";
  if (typeof node.src === "string") return node.src;
  // @portabletext/markdown が url フィールドで出す場合
  if (typeof node.url === "string") return node.url;
  return "";
}

/**
 * 外部／相対パス画像を Sanity asset に上げ、image ブロックへ。
 * client が無い・失敗時はリンク段落へフォールバック。
 * あわせて「block の children に block」を平坦化する。
 */
async function normalizeImages(blocks, options = {}) {
  const { client = null, baseDir = process.cwd() } = options;
  if (!Array.isArray(blocks)) return blocks;

  const cache = new Map();

  async function toAssetImage(node) {
    const src = imageSrcOf(node);
    if (!src || isTrackingImageUrl(src) || isDecorativeSkipImageUrl(src)) {
      return null;
    }
    if (node.asset) {
      return {
        _type: "image",
        // 同一 asset でも出現ごとにユニークな key が必要（React / PortableText）
        _key: key(),
        asset: node.asset,
        alt: node.alt || "",
      };
    }
    if (!client) return null;

    let assetRef = cache.get(src);
    if (assetRef === null) return null;
    if (!assetRef) {
      try {
        const asset = await uploadImageAsset(client, src, baseDir);
        assetRef = { _type: "reference", _ref: asset._id };
        cache.set(src, assetRef);
        console.log(`  image: uploaded ${src.slice(0, 80)}`);
      } catch (err) {
        console.warn(
          `  image: upload failed ${src.slice(0, 80)} (${err?.message || err})`,
        );
        cache.set(src, null);
        return null;
      }
    }

    return {
      _type: "image",
      _key: key(),
      asset: assetRef,
      alt: node.alt || "",
    };
  }

  async function walk(nodes) {
    const out = [];
    for (const item of nodes) {
      if (item?._type === "image") {
        const src = imageSrcOf(item);
        if (item.asset && !src) {
          out.push(item);
          continue;
        }
        if (src && (isTrackingImageUrl(src) || isDecorativeSkipImageUrl(src))) {
          continue;
        }
        const uploaded = await toAssetImage(item);
        if (uploaded) {
          out.push(uploaded);
          continue;
        }
        if (src) {
          const link = externalImageToLinkBlock({
            src,
            alt: item.alt,
          });
          if (link) out.push(link);
        }
        continue;
      }

      if (item?._type === "block" && Array.isArray(item.children)) {
        const markDefs = [...(item.markDefs || [])];
        const children = [];
        const hoisted = [];

        for (const child of item.children) {
          if (child?._type === "block") {
            hoisted.push(child);
            continue;
          }
          if (child?._type === "image") {
            const src = imageSrcOf(child);
            if (
              !src ||
              isTrackingImageUrl(src) ||
              isDecorativeSkipImageUrl(src)
            ) {
              continue;
            }
            const uploaded = await toAssetImage(child);
            if (uploaded) {
              hoisted.push(uploaded);
              continue;
            }
            const markKey = key();
            markDefs.push({ _type: "link", _key: markKey, href: src });
            children.push({
              _type: "span",
              _key: key(),
              text: (child.alt || src).trim() || src,
              marks: [markKey],
            });
            continue;
          }
          children.push(child);
        }

        if (children.some((c) => c?._type === "span" && (c.text || "").length)) {
          out.push({
            ...item,
            _key: item._key || key(),
            children,
            markDefs,
          });
        }
        out.push(...(await walk(hoisted)));
        continue;
      }

      if (item && typeof item === "object") {
        const copy = { ...item };
        if (Array.isArray(copy.body)) copy.body = await walk(copy.body);
        if (Array.isArray(copy.answer)) copy.answer = await walk(copy.answer);
        if (Array.isArray(copy.items)) {
          copy.items = await Promise.all(
            copy.items.map(async (it) =>
              it && typeof it === "object"
                ? { ...it, answer: await walk(it.answer || []) }
                : it,
            ),
          );
        }
        out.push(copy);
        continue;
      }

      out.push(item);
    }
    return out;
  }

  return walk(blocks);
}

function flattenBlockquotes(blocks) {
  return blocks.map((b) => {
    if (b?._type === "block" && b.style === "blockquote") {
      return { ...b, style: "normal" };
    }
    return b;
  });
}

export async function uploadImageAsset(client, src, baseDir = process.cwd()) {
  let buffer;
  let filename = "image";
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
    try {
      const u = new URL(src);
      filename = u.pathname.split("/").pop() || "image";
      filename =
        decodeURIComponent(filename).replace(/[^a-zA-Z0-9._-]/g, "_") ||
        "image";
    } catch {
      /* ignore */
    }
  } else {
    const path = resolve(baseDir, src);
    if (!existsSync(path)) throw new Error(`ファイルなし: ${path}`);
    buffer = readFileSync(path);
    filename = src.split(/[/\\]/).pop() || "image";
  }
  return client.assets.upload("image", buffer, { filename });
}

/** speechBubble に話し手別アイコン（Sanity asset）を付与。質問者は3種を順に割り当て */
async function attachSpeechIcons(blocks, client, baseDir) {
  const cache = new Map();
  let questionerSeq = 0;

  async function uploadCached(rel, alt) {
    if (cache.has(rel)) return cache.get(rel);
    const asset = await uploadImageAsset(client, rel, baseDir);
    const icon = {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
      alt,
    };
    cache.set(rel, icon);
    return icon;
  }

  async function iconFor(node) {
    if (node.speaker === "ヤノヒデ" || node.speaker === "ひよこ忍者") {
      return uploadCached(OPERATOR_AVATAR_FILE, "ひよこ忍者");
    }
    // 出現順で a→b→c→a…（見た目はランダム感、記事内で3種が均等に出る）
    const idx = questionerSeq % QUESTIONER_AVATAR_FILES.length;
    questionerSeq += 1;
    const rel = QUESTIONER_AVATAR_FILES[idx];
    return uploadCached(rel, `質問者-${idx + 1}`);
  }

  async function walk(nodes) {
    if (!Array.isArray(nodes)) return nodes;
    const out = [];
    for (const node of nodes) {
      if (!node || typeof node !== "object") {
        out.push(node);
        continue;
      }
      let next = { ...node };
      if (next._type === "speechBubble") {
        next.icon = await iconFor(next);
      }
      if (next._type === "titledFrame" && next.avatarSrc && !next.avatar) {
        const src = String(next.avatarSrc);
        try {
          const asset = await uploadImageAsset(client, src, baseDir);
          next.avatar = {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: "ヤノヒデ",
          };
        } catch (err) {
          console.warn(
            `  titledFrame avatar upload failed: ${src} (${err?.message || err})`,
          );
        }
        delete next.avatarSrc;
      }
      if (next._type === "servicePromoCard" && next.iconSrc && !next.icon) {
        const src = String(next.iconSrc);
        try {
          const asset = await uploadImageAsset(client, src, baseDir);
          next.icon = {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: String(next.iconAlt || next.title || ""),
          };
        } catch (err) {
          console.warn(
            `  servicePromoCard icon upload failed: ${src} (${err?.message || err})`,
          );
          next.icon = {
            _type: "image",
            src,
            alt: String(next.iconAlt || next.title || ""),
          };
        }
        delete next.iconSrc;
        delete next.iconAlt;
      }
      if (next._type === "relatedArticleCard" && next.imageSrc && !next.image) {
        const src = String(next.imageSrc);
        try {
          const asset = await uploadImageAsset(client, src, baseDir);
          next.image = {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: next.title || "",
          };
        } catch (err) {
          console.warn(
            `  relatedArticleCard image upload failed: ${src} (${err?.message || err})`,
          );
          next.image = { _type: "image", src, alt: next.title || "" };
        }
        delete next.imageSrc;
      }
      if (next._type === "appReachCard") {
        if (next.iconSrc && !next.icon) {
          const src = String(next.iconSrc);
          try {
            const asset = await uploadImageAsset(client, src, baseDir);
            next.icon = {
              _type: "image",
              asset: { _type: "reference", _ref: asset._id },
              alt: String(next.iconAlt || next.title || ""),
            };
          } catch (err) {
            console.warn(
              `  appReachCard icon upload failed: ${src} (${err?.message || err})`,
            );
            next.icon = {
              _type: "image",
              src,
              alt: String(next.iconAlt || next.title || ""),
            };
          }
          delete next.iconSrc;
          delete next.iconAlt;
        }
        if (Array.isArray(next.storeBadges)) {
          next.storeBadges = await Promise.all(
            next.storeBadges.map(async (badge) => {
              if (!badge?.imageSrc || badge.image) {
                const copy = { ...badge };
                delete copy.imageSrc;
                return copy;
              }
              const src = String(badge.imageSrc);
              try {
                const asset = await uploadImageAsset(client, src, baseDir);
                return {
                  url: badge.url,
                  image: {
                    _type: "image",
                    asset: { _type: "reference", _ref: asset._id },
                    alt: "",
                  },
                };
              } catch (err) {
                console.warn(
                  `  appReachCard store badge upload failed: ${src} (${err?.message || err})`,
                );
                return {
                  url: badge.url,
                  image: { _type: "image", src, alt: "" },
                };
              }
            }),
          );
        }
      }
      if (Array.isArray(next.body)) next.body = await walk(next.body);
      if (Array.isArray(next.answer)) next.answer = await walk(next.answer);
      if (Array.isArray(next.items)) {
        next.items = await Promise.all(
          next.items.map(async (it) =>
            it && typeof it === "object"
              ? { ...it, answer: await walk(it.answer || []) }
              : it,
          ),
        );
      }
      out.push(next);
    }
    return out;
  }

  return walk(blocks);
}

export async function mdToPortableText(markdown, options = {}) {
  const { client, baseDir = process.cwd() } = options;
  if (!markdown || !markdown.trim()) {
    return [];
  }

  let md = preprocessMarkdownBlockquotes(markdown);
  md = preprocessRelatedArticleCards(md);
  md = preprocessAppReachCards(md);
  md = preprocessAffiliateCtas(md);
  md = preprocessLinkedImages(md);
  md = preprocessBoldColons(md);
  md = preprocessServicePromoCards(md);
  md = preprocessEdgeListFrames(md);

  const segments = splitFences(md);
  let blocks = [];
  for (const seg of segments) {
    if (seg.type === "md") {
      blocks.push(...convertMdChunk(seg.content));
    } else {
      blocks.push(...fenceToBlocks(seg.kind, seg.inner));
    }
  }

  blocks = extractQaBlocks(blocks);
  blocks = extractNamedH3Accordions(blocks);
  blocks = await normalizeImages(blocks, { client, baseDir });
  blocks = flattenBlockquotes(blocks);
  // 「」等で残った **…** を strong マークへ
  blocks = fixLiteralBoldInBlocks(blocks);
  blocks = promoteAppReachBlocksPortableText(blocks, (i) => key());

  if (client) {
    blocks = await attachSpeechIcons(blocks, client, baseDir);
  }

  return blocks;
}

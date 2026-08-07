/**
 * articles/_wp-html-cache/*.html → articles/*.md（画像保持）→ Sanity 再入稿
 *
 * Usage:
 *   node scripts/rebuild-md-from-wp-cache.mjs                 # MD だけ再生成
 *   node scripts/rebuild-md-from-wp-cache.mjs --upload        # MD + Sanity publish
 *   node scripts/rebuild-md-from-wp-cache.mjs --slugs=a,b --upload
 */
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { normalizeSpeechAvatars } from "./lib/normalize-speech-avatars.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const PORTFOLIO_ROOT = "/Users/sono/code/website/20260518_my_portfolio";
const CACHE_DIR = join(PROJECT_ROOT, "articles/_wp-html-cache");
const LOG_PATH = join(PROJECT_ROOT, "articles/_rebuild-images-log.jsonl");

const requireFromPortfolio = createRequire(
  join(PORTFOLIO_ROOT, "package.json"),
);
const TurndownService = requireFromPortfolio("turndown");
const { gfm } = requireFromPortfolio("turndown-plugin-gfm");

const OPERATOR_BLOCK = `:::titled-box
title: サイト運営者の情報
style: band
avatar: yanohide
avatarCaption: ひよこ忍者

- 本業： 介護施設の職員（歴18年）
- 副業： AIを活用したブログ運営＆仮想通貨投資で資産運用
- 資格： 2級FP技能士×ケアマネ
- ミッション： 学びながら稼ぐ！「AI×仮想通貨」で老後やインフレに備える資産防衛術をお届けします。
- 一言： 読書好きのアラフィフ2児のパパです。
:::
`;

function parseArgs(argv) {
  const out = { upload: false, slugs: null };
  for (const a of argv) {
    if (a === "--upload") out.upload = true;
    else if (a.startsWith("--slugs="))
      out.slugs = a
        .slice(8)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  }
  return out;
}

function findBalancedEnd(html, openStart, openTagRe, closeTag) {
  const openRe = new RegExp(openTagRe, "gi");
  const closeRe = new RegExp(closeTag, "gi");
  openRe.lastIndex = openStart;
  const first = openRe.exec(html);
  if (!first || first.index !== openStart) return -1;
  let depth = 1;
  let pos = openRe.lastIndex;
  while (depth > 0 && pos < html.length) {
    openRe.lastIndex = pos;
    closeRe.lastIndex = pos;
    const nextOpen = openRe.exec(html);
    const nextClose = closeRe.exec(html);
    if (!nextClose) return -1;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      pos = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      pos = nextClose.index + nextClose[0].length;
    }
  }
  return depth === 0 ? pos : -1;
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/** swell / SWELL系吹き出し → :::speech */
function convertBalloons(src) {
  const openRe =
    /<div class="(?:swell-block-balloon|c-balloon)[^"]*"[^>]*>/gi;
  let out = "";
  let last = 0;
  let m;
  while ((m = openRe.exec(src))) {
    const start = m.index;
    const end = findBalancedEnd(src, start, "<div\\b", "</div>");
    if (end < 0) break;
    out += src.slice(last, start);
    const block = src.slice(start, end);
    const speakerMatch =
      block.match(/<span class="c-balloon__iconName">([^<]*)<\/span>/i) ||
      block.match(/class="c-balloon__name"[^>]*>([^<]*)</i);
    const speaker = speakerMatch?.[1]?.trim() || "案内";
    const side = /-bln-right/.test(block) ? "right" : "left";
    const textMatch =
      block.match(
        /<div class="c-balloon__text">([\s\S]*?)(?:<span class="c-balloon__shapes">|<\/div>)/i,
      ) ||
      block.match(/<div class="c-balloon__text[^"]*">([\s\S]*?)<\/div>/i);
    const body = stripTags(textMatch?.[1] ?? "");
    if (body) {
      out += `\n\n:::speech\nspeaker: ${speaker}\nside: ${side}\ntone: sky\n\n${body}\n:::\n\n`;
    }
    last = end;
    openRe.lastIndex = end;
  }
  out += src.slice(last);
  return out;
}

function convertCapboxes(src) {
  const openRe = /<div class="swell-block-capbox[^"]*">/gi;
  let out = "";
  let last = 0;
  let m;
  while ((m = openRe.exec(src))) {
    const start = m.index;
    const end = findBalancedEnd(src, start, "<div\\b", "</div>");
    if (end < 0) break;
    out += src.slice(last, start);
    const block = src.slice(start, end);
    const titleMatch = block.match(
      /<div class="cap_box_ttl[^"]*">([\s\S]*?)<\/div>/i,
    );
    const title = stripTags(titleMatch?.[1] ?? "");
    let inner = "";
    const contentOpen = block.search(/<div class="cap_box_content">/i);
    if (contentOpen >= 0) {
      const contentEnd = findBalancedEnd(
        block,
        contentOpen,
        "<div\\b",
        "</div>",
      );
      if (contentEnd > 0) {
        const openTagEnd = block.indexOf(">", contentOpen) + 1;
        inner = block.slice(openTagEnd, contentEnd - "</div>".length);
      }
    }
    if (title) out += `\n\n**${title}**\n\n`;
    out += inner;
    last = end;
    openRe.lastIndex = end;
  }
  out += src.slice(last);
  return out;
}

/** -300x158 等をフルサイズ URL に寄せる（存在すればアップロード品質向上） */
function preferFullSizeImages(html) {
  return String(html || "").replace(
    /(<img\b[^>]*\bsrc=["'])([^"']+)(["'])/gi,
    (_m, pre, src, post) => {
      const cleaned = src.replace(
        /-\d+x\d+(?=\.(?:jpe?g|png|gif|webp))/i,
        "",
      );
      return `${pre}${cleaned}${post}`;
    },
  );
}

function htmlToMarkdown(html) {
  let h = String(html || "");
  h = preferFullSizeImages(h);
  h = convertBalloons(h);
  h = convertCapboxes(h);
  h = h.replace(/<div[^>]*class="[^"]*p-ad[^"]*"[\s\S]*?<\/div>/gi, "");
  h = h.replace(/<div[^>]*id="toc[^"]*"[\s\S]*?<\/div>/gi, "");

  const turndown = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
  });
  turndown.use(gfm);
  // 画像だけの <p><a><img></a></p> は textContent が空なので消さない
  turndown.addRule("removeEmpty", {
    filter: (node) =>
      node.nodeName === "P" &&
      !node.textContent.trim() &&
      !node.querySelector?.("img"),
    replacement: () => "",
  });

  const speechHolders = [];
  h = h.replace(/\n*:::speech\n([\s\S]*?)\n:::\n*/g, (_, body) => {
    const i = speechHolders.length;
    speechHolders.push(`:::speech\n${body.trim()}\n:::`);
    return `\n<p>SPEECHPHXX${i}XX</p>\n`;
  });
  let md = turndown.turndown(h);
  md = md.replace(/SPEECHPHXX(\d+)XX/g, (_, i) => {
    return `\n\n${speechHolders[Number(i)]}\n\n`;
  });
  md = md.replace(/\\\*\\\*/g, "**");

  for (const re of [
    /^広告\s*$/gm,
    /^目次\s*$/gm,
    /^スクロールできます\s*$/gm,
    /^MENU\s*$/gm,
    /^閉じる\s*$/gm,
    /^URLをコピーしました！\s*$/gm,
    /^よかったらシェアしてね！\s*$/gm,
    /^## 関連記事[\s\S]*$/m,
  ]) {
    md = md.replace(re, "");
  }
  const _out = md.replace(/\n{3,}/g, "\n\n").trim();
  return _out;
}

function guessCategory(slug, title) {
  const s = `${slug} ${title}`.toLowerCase();
  if (
    /nft|opensea|cnp|cryptoninjya|metabatch|aopanda|magicavoxel|plt|land/.test(
      s,
    )
  ) {
    if (/land|metaverse|メタバース/.test(s)) return "メタバース";
    return "NFT";
  }
  if (/metaverse|メタバース/.test(s)) return "メタバース";
  if (
    /pancake|defi|metamask|bybit|bnb|bsc|staking|farming|swap|ステーキング|ファーミング/.test(
      s,
    )
  ) {
    return "DeFi";
  }
  if (
    /audible|audiobook|bungaku|voicy|bookrecommend|村上|シェイクスピア|書評/.test(
      s,
    )
  ) {
    return null;
  }
  return "仮想通貨";
}

function cleanMarkdown(md, category) {
  let text = String(md || "").replace(/\r\n/g, "\n").replace(/\u00a0/g, "");
  text = text.replace(/\n##\s*関連記事[\s\S]*$/m, "\n");
  text = text.replace(
    /^.*!\[[^\]]*\]\([^)]*(?:-150x150|kaisya_|fukidashi|questioner-)[^)]*\)[^\n]*\n?/gim,
    "",
  );
  text = normalizeSpeechAvatars(text).text;

  const reliabilityRe =
    /\*\*記事の信頼性\*\*[\s\S]*?(?=\n(?:結論|本記事では|なお、|ちなみに|## |:::speech|\*\*[^*]+\*\*\n\n(?!-)))/;
  if (/\*\*記事の信頼性\*\*/.test(text)) {
    text = text.replace(reliabilityRe, `${OPERATOR_BLOCK}\n`);
  } else if (!/title:\s*サイト運営者の情報/.test(text)) {
    const fmEnd = text.indexOf("\n---\n");
    const insertAt =
      fmEnd >= 0
        ? (() => {
            const after = text.indexOf("\n## ", fmEnd + 5);
            return after > 0 ? after : fmEnd + 5;
          })()
        : 0;
    if (insertAt > 0) {
      text =
        text.slice(0, insertAt) +
        `\n\n${OPERATOR_BLOCK}\n` +
        text.slice(insertAt);
    }
  }

  text = text.replace(/^##\s*\*\*よくある質問\*\*\s*$/m, "## よくある質問");
  text = text.replace(/^##\s*\*\*質問と回答\*\*\s*$/m, "## 質問と回答");
  text = normalizeFaqQuestions(text);
  text = text.replace(
    /(あわせて読みたい)\n\n(!\[[^\]]*\]\([^\)]+\))\n\n(\[[^\]]+\]\([^\)]+\))[^\n]*/g,
    "$1\n\n$2\n\n$3\n",
  );

  if (category && !/^categories:/m.test(text.slice(0, 500))) {
    text = text.replace(
      /^(---\n[\s\S]*?)(---\n)/m,
      (_m, head, close) =>
        `${head.replace(/\n$/, "")}\ncategories:\n  - ${category}\n${close}`,
    );
  }
  return text;
}

function normalizeFaqQuestions(text) {
  const start = text.search(/^##\s+(よくある質問|質問と回答)\s*$/m);
  if (start < 0) return text;
  const rest = text.slice(start);
  const endRel = rest.search(/\n##\s+(?!#)/);
  const end = endRel > 0 ? start + endRel : text.length;
  let mid = text.slice(start, end);
  mid = mid.replace(/^\*\*([^*]{8,120}[？?])\*\*\s*$/gm, "### $1");
  return text.slice(0, start) + mid + text.slice(end);
}

function countMdImages(md) {
  return (String(md).match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
}

function rebuildOne(slug) {
  const htmlPath = join(CACHE_DIR, `${slug}.html`);
  const mdPath = join(PROJECT_ROOT, "articles", `${slug}.md`);
  if (!existsSync(htmlPath)) throw new Error(`cache missing: ${slug}`);
  if (!existsSync(mdPath)) throw new Error(`md missing: ${slug}`);

  const prev = matter(readFileSync(mdPath, "utf8"));
  const html = readFileSync(htmlPath, "utf8");
  const bodyMd = htmlToMarkdown(html);
  const title = String(prev.data.title || slug);
  const category =
    Array.isArray(prev.data.categories) && prev.data.categories[0]
      ? prev.data.categories[0]
      : guessCategory(slug, title);

  // 既存 front matter を維持（hero / categories / publishedAt など）
  const data = { ...prev.data };
  if (category && !data.categories) data.categories = [category];

  let out = matter.stringify(bodyMd, data);
  out = cleanMarkdown(out, category);
  // cleanMarkdown が categories を二重付与しないよう、既にあればそのまま

  const before = countMdImages(prev.content);
  const after = countMdImages(out);
  writeFileSync(mdPath, out.endsWith("\n") ? out : `${out}\n`, "utf8");
  return { slug, before, after, delta: after - before };
}

function runUpload(relMd) {
  return execFileSync(
    "npm",
    ["run", "upload:sanity-publish", "--", relMd, "--publish"],
    {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      maxBuffer: 40 * 1024 * 1024,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function logLine(obj) {
  writeFileSync(LOG_PATH, `${JSON.stringify(obj)}\n`, {
    flag: "a",
    encoding: "utf8",
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  mkdirSync(join(PROJECT_ROOT, "articles"), { recursive: true });
  writeFileSync(LOG_PATH, "", "utf8");

  let slugs = readdirSync(CACHE_DIR)
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.replace(/\.html$/, ""))
    .sort();
  if (opts.slugs?.length) slugs = slugs.filter((s) => opts.slugs.includes(s));

  console.log(`Rebuild targets: ${slugs.length} (upload=${opts.upload})`);
  let ok = 0;
  let ng = 0;
  for (const slug of slugs) {
    const started = Date.now();
    try {
      const r = rebuildOne(slug);
      console.log(
        `MD ${slug}: images ${r.before} → ${r.after} (Δ${r.delta >= 0 ? "+" : ""}${r.delta})`,
      );
      if (opts.upload) {
        console.log(`  uploading…`);
        const out = runUpload(`articles/${slug}.md`);
        const tail = String(out).trim().split("\n").slice(-4).join(" | ");
        console.log(`  ${tail}`);
        // 連続負荷緩和（画像アップロードが多い）
        await new Promise((r) => setTimeout(r, 800));
      }
      logLine({ ok: true, ...r, uploaded: opts.upload, ms: Date.now() - started });
      ok++;
    } catch (err) {
      const msg = err?.stderr || err?.stdout || err?.message || String(err);
      console.error(`FAIL ${slug}:`, String(msg).slice(0, 400));
      logLine({
        ok: false,
        slug,
        error: String(msg).slice(0, 800),
        ms: Date.now() - started,
      });
      ng++;
    }
  }
  console.log(`\nDONE ok=${ok} ng=${ng} log=${LOG_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * cryptoblog バッチ移行（wp-to-sanity-migration-jp デフォルト清掃込み）
 * Usage:
 *   node scripts/migrate-wp-batch.mjs --from=5 --to=69
 *   node scripts/migrate-wp-batch.mjs --slugs=a,b,c
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSpeechAvatars } from "./lib/normalize-speech-avatars.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const PORTFOLIO_ROOT = "/Users/sono/code/website/20260518_my_portfolio";
const WP_BASE = process.env.WP_BASE || "https://snooks.xsrv.jp";
const SLUG_LIST =
  "/Users/sono/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidian_main/RMJtaro＿docs/スラッグ一覧";
const LOG_PATH = join(PROJECT_ROOT, "articles/_migrate-batch-log.jsonl");

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
  const out = { from: 5, to: 69, slugs: null, skipUpload: false, skipDone: true };
  for (const a of argv) {
    if (a.startsWith("--from=")) out.from = Number(a.slice(7));
    else if (a.startsWith("--to=")) out.to = Number(a.slice(5));
    else if (a.startsWith("--slugs="))
      out.slugs = a
        .slice(8)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--skip-upload") out.skipUpload = true;
    else if (a === "--no-skip-done") out.skipDone = false;
  }
  return out;
}

function loadDoneSlugs() {
  if (!existsSync(LOG_PATH)) return new Set();
  const set = new Set();
  for (const line of readFileSync(LOG_PATH, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      if (o.ok && o.slug) set.add(o.slug);
    } catch {
      /* ignore */
    }
  }
  return set;
}

function loadSlugRows() {
  const text = readFileSync(SLUG_LIST, "utf8");
  const rows = [];
  for (const line of text.split("\n")) {
    const m = /^\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*([a-zA-Z0-9_-]+)\s*\|\s*(☑|☐)\s*\|/.exec(
      line,
    );
    if (!m) continue;
    rows.push({
      n: Number(m[1]),
      title: m[2].replace(/&#038;/g, "&").trim(),
      slug: m[3],
      done: m[4] === "☑",
    });
  }
  return rows;
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
    return null; // ハブ外は categories なし
  }
  return "仮想通貨";
}

async function fetchMeta(slug, attempt = 1) {
  const url = `${WP_BASE}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`;
  try {
    // curl 優先（この環境では Node fetch が間欠失敗しやすい）
    const raw = execFileSync(
      "curl",
      ["-fsSL", "--max-time", "90", "-H", "Accept: application/json", url],
      { encoding: "utf8", maxBuffer: 15 * 1024 * 1024 },
    );
    const d = JSON.parse(raw);
    if (!d?.[0]) throw new Error("Post not found");
    const p = d[0];
    const title = decodeHtml(p.title?.rendered || "");
    let excerpt = stripTags(p.excerpt?.rendered || "").replace(/\s+/g, " ").trim();
    if (!excerpt || /記事の信頼性|上記のような質問/.test(excerpt)) {
      excerpt = `${title}について解説します。`;
    }
    if (excerpt.length > 180) excerpt = `${excerpt.slice(0, 177)}…`;
    const img = p._embedded?.["wp:featuredmedia"]?.[0] || {};
    const heroImage = img.source_url || "";
    const heroImageAlt = (img.alt_text || title.slice(0, 40) || "アイキャッチ").trim();
    return {
      title,
      slug: p.slug,
      publishedAt: String(p.date || "").slice(0, 10),
      excerpt,
      heroImage,
      heroImageAlt,
    };
  } catch (err) {
    if (attempt >= 4) throw err;
    const wait = 2000 * attempt;
    console.warn(`  retry fetchMeta ${slug} #${attempt} after ${wait}ms (${err.message})`);
    await new Promise((r) => setTimeout(r, wait));
    return fetchMeta(slug, attempt + 1);
  }
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, "")
    .trim();
}

function stripTags(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMarkdown(md, category) {
  let text = String(md || "").replace(/\r\n/g, "\n").replace(/\u00a0/g, "");

  // ## 関連記事 以降
  text = text.replace(/\n##\s*関連記事[\s\S]*$/m, "\n");

  // 小さい装飾イラスト
  text = text.replace(
    /^.*!\[[^\]]*\]\([^)]*(?:-150x150|kaisya_|fukidashi|questioner-)[^)]*\)[^\n]*\n?/gim,
    "",
  );

  // アバター画像＋悩む人/sonoko → :::speech（質問者／ヤノヒデ）
  text = normalizeSpeechAvatars(text).text;

  // 記事の信頼性ブロック → 運営者枠
  const reliabilityRe =
    /\*\*記事の信頼性\*\*[\s\S]*?(?=\n(?:結論|本記事では|なお、|ちなみに|## |:::speech|\*\*[^*]+\*\*\n\n(?!-)))/;
  if (/\*\*記事の信頼性\*\*/.test(text)) {
    text = text.replace(reliabilityRe, `${OPERATOR_BLOCK}\n`);
  } else if (!/title:\s*サイト運営者の情報/.test(text)) {
    // 目次〜本文のあいだに挿入（最初の ## の直前、なければ front matter 直後）
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

  // FAQ 見出し正規化
  text = text.replace(/^##\s*\*\*よくある質問\*\*\s*$/m, "## よくある質問");
  text = text.replace(/^##\s*\*\*質問と回答\*\*\s*$/m, "## 質問と回答");

  // FAQ 内の **質問？** / 単独質問行 → ###（簡易）
  text = normalizeFaqQuestions(text);

  // あわせて読みたいの長い抜粋を落とす
  text = text.replace(
    /(あわせて読みたい)\n\n(!\[[^\]]*\]\([^\)]+\))\n\n(\[[^\]]+\]\([^\)]+\))[^\n]*/g,
    "$1\n\n$2\n\n$3\n",
  );

  // categories を front matter に付与
  if (category && !/^categories:/m.test(text.slice(0, 400))) {
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
  // **質問文？** 単独行
  mid = mid.replace(
    /^\*\*([^*]{8,120}[？?])\*\*\s*$/gm,
    "### $1",
  );
  return text.slice(0, start) + mid + text.slice(end);
}

function markSlugDone(slug) {
  let text = readFileSync(SLUG_LIST, "utf8");
  const re = new RegExp(
    `(\\|\\s*\\d+\\s*\\|.*?\\|\\s*${slug}\\s*\\|\\s*)☐(\\s*\\|)`,
  );
  if (re.test(text)) {
    text = text.replace(re, "$1☑$2");
    writeFileSync(SLUG_LIST, text, "utf8");
  }
}

function logLine(obj) {
  writeFileSync(LOG_PATH, `${JSON.stringify(obj)}\n`, {
    flag: "a",
    encoding: "utf8",
  });
  console.log(JSON.stringify(obj));
}

function runWpToMd(slug, meta, outPath) {
  const metaJson = JSON.stringify(meta);
  execFileSync(
    "node",
    [
      join(PORTFOLIO_ROOT, "scripts/kaimonavi/wp-to-md.mjs"),
      slug,
      outPath,
      metaJson,
    ],
    {
      cwd: PORTFOLIO_ROOT,
      env: { ...process.env, WP_BASE },
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  );
}

function runUpload(relMd) {
  execFileSync(
    "npm",
    ["run", "upload:sanity-publish", "--", relMd, "--publish"],
    {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: process.env,
    },
  );
}

async function migrateOne(row, opts) {
  const { slug, title, n } = row;
  const outPath = join(PROJECT_ROOT, "articles", `${slug}.md`);
  const started = Date.now();
  try {
    const meta = await fetchMeta(slug);
    // 一覧タイトルが正しければ優先（HTML実体を含む場合）
    if (title && title.length > 5) meta.title = title;
    runWpToMd(slug, meta, outPath);
    const category = guessCategory(slug, meta.title);
    let md = readFileSync(outPath, "utf8");
    md = cleanMarkdown(md, category);
    writeFileSync(outPath, md, "utf8");
    if (!opts.skipUpload) {
      const out = runUpload(`articles/${slug}.md`);
      const idMatch = /OK:\s+\w*\s*([a-f0-9-]{36})/i.exec(out) ||
        /updated published ([a-f0-9-]{36})/i.exec(out) ||
        /published ([a-f0-9-]{36})/i.exec(out);
      markSlugDone(slug);
      logLine({
        ok: true,
        n,
        slug,
        category,
        id: idMatch?.[1] || null,
        ms: Date.now() - started,
      });
      return { ok: true, slug };
    }
    logLine({ ok: true, n, slug, category, skippedUpload: true, ms: Date.now() - started });
    return { ok: true, slug };
  } catch (err) {
    const msg = err?.stderr || err?.stdout || err?.message || String(err);
    logLine({
      ok: false,
      n,
      slug,
      error: String(msg).slice(0, 500),
      ms: Date.now() - started,
    });
    return { ok: false, slug, error: msg };
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  mkdirSync(join(PROJECT_ROOT, "articles"), { recursive: true });
  if (!existsSync(LOG_PATH)) writeFileSync(LOG_PATH, "", "utf8");

  const rows = loadSlugRows();
  const done = opts.skipDone ? loadDoneSlugs() : new Set();
  let targets;
  if (opts.slugs?.length) {
    targets = rows.filter((r) => opts.slugs.includes(r.slug));
  } else {
    targets = rows.filter((r) => r.n >= opts.from && r.n <= opts.to);
  }
  if (opts.skipDone) {
    const before = targets.length;
    targets = targets.filter((r) => !done.has(r.slug));
    console.log(`Skip already-ok: ${before - targets.length}`);
  }

  console.log(`Targets: ${targets.length} (from list ${opts.from}-${opts.to})`);
  let ok = 0;
  let ng = 0;
  for (const row of targets) {
    console.log(`\n=== #${row.n} ${row.slug} ===`);
    const r = await migrateOne(row, opts);
    if (r.ok) ok++;
    else ng++;
    // WP / Sanity への連続負荷を抑える
    await new Promise((r) => setTimeout(r, 1200));
  }
  console.log(`\nDONE ok=${ok} ng=${ng} log=${LOG_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

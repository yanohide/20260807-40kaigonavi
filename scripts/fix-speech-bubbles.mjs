/**
 * 既存 articles/*.md の「悩む人/sonoko アバター行」を :::speech に直し、Sanity 再入稿する。
 *
 * Usage:
 *   node scripts/fix-speech-bubbles.mjs                 # 変換のみ
 *   node scripts/fix-speech-bubbles.mjs --upload        # 変換があったファイルだけ再入稿
 *   node scripts/fix-speech-bubbles.mjs --upload-all    # 全 md を再入稿（変換も実行）
 *   node scripts/fix-speech-bubbles.mjs --upload-all --slugs=coincheck-land
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSpeechAvatars } from "./lib/normalize-speech-avatars.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const ARTICLES = join(PROJECT_ROOT, "articles");
const LOG = join(ARTICLES, "_fix-speech-log.jsonl");

function parseArgs(argv) {
  const out = { upload: false, uploadAll: false, slugs: null };
  for (const a of argv) {
    if (a === "--upload") out.upload = true;
    else if (a === "--upload-all") {
      out.upload = true;
      out.uploadAll = true;
    } else if (a.startsWith("--slugs="))
      out.slugs = a
        .slice(8)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = readdirSync(ARTICLES)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .filter((f) => {
      if (!args.slugs) return true;
      const slug = f.replace(/\.md$/, "");
      return args.slugs.includes(slug);
    })
    .sort();

  writeFileSync(LOG, "", "utf8");
  const toUpload = [];
  let totalConverted = 0;

  for (const file of files) {
    const path = join(ARTICLES, file);
    const before = readFileSync(path, "utf8");
    const { text, converted } = normalizeSpeechAvatars(before);
    if (text !== before) {
      writeFileSync(path, text, "utf8");
      totalConverted += converted;
      console.log(`fixed ${file}: ${converted} bubbles`);
      toUpload.push(file);
    } else if (args.uploadAll) {
      toUpload.push(file);
    }
  }

  console.log(
    `\nMD updated bubbles: ${totalConverted}; upload targets: ${toUpload.length}`,
  );

  if (!args.upload) {
    console.log("Skip upload (pass --upload or --upload-all).");
    return;
  }

  let ok = 0;
  let ng = 0;
  for (const file of toUpload) {
    const path = join(ARTICLES, file);
    const t0 = Date.now();
    try {
      execFileSync(
        "npm",
        ["run", "upload:sanity-publish", "--", path, "--publish"],
        {
          cwd: PROJECT_ROOT,
          stdio: ["ignore", "pipe", "pipe"],
          encoding: "utf8",
          maxBuffer: 20 * 1024 * 1024,
        },
      );
      ok += 1;
      const row = { ok: true, file, ms: Date.now() - t0 };
      writeFileSync(LOG, `${JSON.stringify(row)}\n`, { flag: "a" });
      console.log(JSON.stringify(row));
    } catch (e) {
      ng += 1;
      const err = String(e?.stderr || e?.stdout || e?.message || e).slice(
        0,
        800,
      );
      const row = { ok: false, file, error: err, ms: Date.now() - t0 };
      writeFileSync(LOG, `${JSON.stringify(row)}\n`, { flag: "a" });
      console.error(JSON.stringify(row));
    }
  }

  console.log(`\nDONE ok=${ok} ng=${ng} log=${LOG}`);
}

main();

/**
 * アプリーチを含む articles/*.md を Sanity へ再入稿（appReachCard 化）。
 *
 * Usage:
 *   node scripts/reupload-appreach-articles.mjs
 *   node scripts/reupload-appreach-articles.mjs --dry-run
 *   node scripts/reupload-appreach-articles.mjs --slug=coincheck-register
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const ARTICLES = join(ROOT, "articles");
const UPLOAD = join(ROOT, "scripts/sanity-publish/upload-article.mjs");
const LOG = join(ARTICLES, "_reupload-appreach-log.jsonl");

function parseArgs(argv) {
  const out = { dryRun: false, slug: null };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--slug=")) out.slug = a.slice(7).trim();
  }
  return out;
}

function listTargets(slugFilter) {
  return readdirSync(ARTICLES)
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(ARTICLES, f))
    .filter((path) => {
      const base = path.split("/").pop() || "";
      if (base.startsWith("_")) return false;
      if (slugFilter && !base.startsWith(`${slugFilter}.md`)) return false;
      const text = readFileSync(path, "utf8");
      return /アプリーチ|posted with/i.test(text);
    })
    .sort();
}

const { dryRun, slug } = parseArgs(process.argv.slice(2));
const targets = listTargets(slug);

console.log(`AppReach re-upload targets: ${targets.length}${dryRun ? " (dry-run)" : ""}`);

let ok = 0;
let fail = 0;

for (const file of targets) {
  const name = file.split("/").pop();
  console.log(`\n→ ${name}`);
  if (dryRun) {
    ok++;
    continue;
  }

  const started = Date.now();
  try {
    execFileSync(process.execPath, [UPLOAD, file, "--publish"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    ok++;
    const line = JSON.stringify({
      ok: true,
      file: name,
      ms: Date.now() - started,
    });
    appendFileSync(LOG, `${line}\n`);
  } catch (err) {
    fail++;
    const line = JSON.stringify({
      ok: false,
      file: name,
      ms: Date.now() - started,
      error: err?.message || String(err),
    });
    appendFileSync(LOG, `${line}\n`);
    console.error(`FAILED: ${name}`);
  }
}

console.log(`\nDone. ok=${ok} fail=${fail}`);
if (fail > 0) process.exit(1);

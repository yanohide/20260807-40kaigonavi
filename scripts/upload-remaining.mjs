#!/usr/bin/env node
/**
 * Upload remaining slugs to Sanity and append _upload-all-log.jsonl
 * Usage: node scripts/upload-remaining.mjs slug1 slug2 ...
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logPath = join(root, "articles/_upload-all-log.jsonl");
const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error("Usage: node scripts/upload-remaining.mjs <slug>...");
  process.exit(1);
}

function redact(s) {
  return String(s || "").replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer REDACTED");
}

for (const slug of slugs) {
  const file = `articles/${slug}.md`;
  const abs = join(root, file);
  if (!existsSync(abs)) {
    console.error(`missing ${file}`);
    continue;
  }
  console.log(`=== uploading ${slug} ===`);
  const started = Date.now();
  let out = "";
  let exitCode = 0;
  try {
    out = execFileSync(
      "npm",
      ["run", "upload:sanity-publish", "--", file, "--publish"],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch (err) {
    exitCode = err.status || 1;
    out = `${err.stdout || ""}\n${err.stderr || ""}`;
  }
  out = redact(out);
  const duration_s = Math.round((Date.now() - started) / 1000);
  const image_uploaded = (out.match(/image: uploaded/g) || []).length;
  const ok_line = (out.split("\n").filter((l) => l.startsWith("OK:")).pop() || "").trim();
  const ok = /OK:\s+/.test(out) && exitCode === 0;
  const row = {
    ts: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    slug,
    file,
    status: ok ? "ok" : "fail",
    exit: exitCode,
    duration_s,
    image_uploaded,
    hero_uploaded: ok ? 1 : 0,
    ok_line,
    error: ok ? "" : out.slice(-400),
  };
  appendFileSync(logPath, `${JSON.stringify(row)}\n`, "utf8");
  console.log(JSON.stringify(row));
  console.log(out.trim().split("\n").slice(-8).join("\n"));
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 600);
}

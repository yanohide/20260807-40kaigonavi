#!/usr/bin/env node
/** Ingest browser CDP Runtime.evaluate JSON dumps into articles/_wp-html-cache/ */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outdir = join(root, "articles/_wp-html-cache");
mkdirSync(outdir, { recursive: true });

function unwrap(raw) {
  let val = raw;
  if (raw?.result?.result?.value != null) val = raw.result.result.value;
  else if (raw?.result?.value != null) val = raw.result.value;
  return typeof val === "string" ? JSON.parse(val) : val;
}

for (const path of process.argv.slice(2)) {
  const data = unwrap(JSON.parse(readFileSync(path, "utf8")));
  for (const [slug, obj] of Object.entries(data)) {
    if (!obj?.html) {
      console.log(`${slug}: FAIL`, obj);
      continue;
    }
    writeFileSync(join(outdir, `${slug}.html`), obj.html, "utf8");
    writeFileSync(
      join(outdir, `${slug}.meta.json`),
      JSON.stringify(
        {
          title: obj.title || "",
          date: obj.date || "",
          excerpt: obj.excerpt || "",
          imgCount: obj.imgCount ?? 0,
        },
        null,
        0,
      ),
      "utf8",
    );
    console.log(`${slug}: imgs=${obj.imgCount}`);
  }
}
console.log(
  "total html",
  readdirSync(outdir).filter((f) => f.endsWith(".html")).length,
);

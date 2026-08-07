// Markdown を Sanity に作成（下書き or 公開）
//
// Usage:
//   npm run upload:sanity-publish -- path/to/article.md
//   npm run upload:sanity-publish -- path/to/article.md --publish
//
// Front Matter: title, slug 必須。categories / publish: true / publishedAt / excerpt 任意。
// .env.local: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_TOKEN など

import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import {
  mdToPortableText,
  uploadImageAsset,
} from "./md-to-portable-text.mjs";

loadDotenv(".env.local");
loadDotenv(".env");

const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID?.trim() ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset =
  process.env.SANITY_STUDIO_DATASET?.trim() ||
  process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() ||
  "production";
const token =
  process.env.SANITY_AUTH_TOKEN?.trim() || process.env.SANITY_API_TOKEN?.trim();

if (!projectId || !token) {
  console.error(
    "Error: projectId / token が不足です。.env.local に NEXT_PUBLIC_SANITY_PROJECT_ID と SANITY_API_TOKEN を設定してください。",
  );
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npm run upload:sanity-publish -- <path/to/article.md>");
  process.exit(1);
}

const absPath = resolve(filePath);
if (!existsSync(absPath)) {
  console.error(`Error: ファイルが見つかりません: ${filePath}`);
  process.exit(1);
}

console.log(`Reading: ${filePath}`);
const raw = readFileSync(absPath, "utf8");
const { data, content } = matter(raw);

if (!data.title || !data.slug) {
  console.error("Error: Front Matter に title と slug が必要です。");
  process.exit(1);
}

console.log(`Title:   ${data.title}`);
console.log(`Slug:    ${data.slug}`);

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2025-01-01",
  useCdn: false,
});

const baseDir = process.cwd();
const body = await mdToPortableText(content.trim(), { client, baseDir });
console.log(`Body:    ${body.length} blocks`);

let heroImage;
const heroSrc = data.heroImage ? String(data.heroImage).trim() : "";
if (heroSrc) {
  try {
    const asset = await uploadImageAsset(client, heroSrc, baseDir);
    heroImage = {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
      alt: data.heroImageAlt ? String(data.heroImageAlt) : "",
    };
    console.log(`Hero:    uploaded ${heroSrc.slice(0, 72)}`);
  } catch (err) {
    console.warn(`Hero:    upload failed (${err?.message || err})`);
  }
}

const draftId = `drafts.${randomUUID()}`;

const doc = {
  _id: draftId,
  _type: "post",
  title: data.title,
  slug: { _type: "slug", current: String(data.slug).trim() },
  excerpt: data.excerpt ? String(data.excerpt) : "",
  body,
  ...(heroImage ? { heroImage } : {}),
};

if (data.publishedAt) {
  doc.publishedAt = new Date(data.publishedAt).toISOString();
}

// site-structure.md の category と一字一句同じ文字列の配列
if (Array.isArray(data.categories)) {
  doc.categories = data.categories.map((c) => String(c).trim()).filter(Boolean);
} else if (typeof data.categories === "string" && data.categories.trim()) {
  doc.categories = [data.categories.trim()];
}

// Front Matter の publish: true、または CLI の --publish で公開ドキュメントとして作成
// （Studio を開かずにハブへ載せたいとき用。省略時は従来どおり下書き）
const wantPublish =
  process.argv.includes("--publish") ||
  data.publish === true ||
  data.publish === "true";

const slugCurrent = String(data.slug).trim();

if (wantPublish) {
  if (!doc.publishedAt) {
    doc.publishedAt = new Date().toISOString();
  }
}

try {
  // 同じ slug があれば更新（再実行で記事が増えないようにする）
  const existingId = await client.fetch(
    `*[_type == "post" && slug.current == $slug][0]._id`,
    { slug: slugCurrent },
  );

  let result;
  if (existingId) {
    const { _id, _type, ...fields } = doc;
    result = await client.patch(existingId).set(fields).commit();
    console.log(`OK:      updated ${wantPublish ? "published" : "draft"} ${result._id}`);
  } else {
    if (wantPublish) {
      doc._id = randomUUID();
    }
    result = await client.create(doc);
    console.log(`OK:      ${wantPublish ? "published" : "draft"} ${result._id}`);
  }

  if (doc.categories?.length) {
    console.log(`Categories: ${doc.categories.join(", ")}`);
  }
  console.log(
    `Studio:  http://localhost:3333/studio/structure/post;${result._id}`,
  );
  console.log(`Site:    /posts/${slugCurrent}`);
  console.log("");
  if (wantPublish) {
    console.log("※ 公開済みです。ハブ／新着をブラウザで確認してください。");
  } else {
    console.log(
      "※ 下書きです。公開するには Front Matter に publish: true を付けるか、",
    );
    console.log("  npm run upload:sanity-publish -- <file> --publish");
    console.log("  または Studio で Publish を押してください。");
  }
} catch (err) {
  console.error("Upload failed:", err.message);
  process.exit(1);
}

function loadDotenv(relPath) {
  const path = resolve(process.cwd(), relPath);
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const envKey = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[envKey]) process.env[envKey] = value;
  }
}

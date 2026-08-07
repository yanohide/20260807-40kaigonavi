/**
 * OpenNext の ISR キャッシュを Workers 静的アセットへコピーする。
 * static-assets-incremental-cache 利用時に build:cf から呼ぶ。
 * （populateCache local は macOS 12 等で workerd 要件により失敗するため）
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cacheDir = path.join(root, ".open-next/cache");
const targetDir = path.join(root, ".open-next/assets/cdn-cgi/_next_cache");

if (!fs.existsSync(cacheDir)) {
  console.error("populate-static-cache: .open-next/cache が見つかりません。先に build:cf を実行してください。");
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(cacheDir, targetDir, { recursive: true });

const count = fs.readdirSync(targetDir, { recursive: true }).length;
console.log(`populate-static-cache: ${count} エントリを cdn-cgi/_next_cache へコピーしました`);

/**
 * macOS 12 など workerd 非対応環境向け。
 * opennextjs-cloudflare deploy は miniflare を起動するため失敗する。
 * open-next.config.ts を一時退避して wrangler deploy のみ実行する。
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "open-next.config.ts");
const backupPath = `${configPath}.bak`;

if (!fs.existsSync(configPath)) {
  console.error("open-next.config.ts が見つかりません。");
  process.exit(1);
}

fs.renameSync(configPath, backupPath);
try {
  execSync("npx wrangler deploy", { stdio: "inherit", cwd: root });
} finally {
  fs.renameSync(backupPath, configPath);
}

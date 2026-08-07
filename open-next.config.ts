import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * ビルド時に生成した HTML を Workers 静的アセット（cdn-cgi/_next_cache）から配信する。
 * ISR の Worker 再レンダリング（Error 1102）を避けるため revalidate は false に統一する。
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});

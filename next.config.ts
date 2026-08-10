import os from "node:os";
import type { NextConfig } from "next";
import type { Redirect } from "next/dist/lib/load-custom-routes";
import { LEGACY_PATH_MAP } from "./src/lib/legacyRedirects";

function legacyConfigRedirects(): Redirect[] {
  const redirects: Redirect[] = [];
  for (const [source, destination] of Object.entries(LEGACY_PATH_MAP)) {
    redirects.push({ source, destination, permanent: true });
    if (!source.endsWith("/")) {
      redirects.push({ source: `${source}/`, destination, permanent: true });
    }
  }
  return redirects;
}

/** workerd は macOS 13.5+（Darwin 22+）が必要。12.x では dev 起動がクラッシュする */
function supportsOpenNextDevRuntime(): boolean {
  if (process.env.OPENNEXT_DEV === "1") return true;
  if (process.env.OPENNEXT_DEV === "0") return false;
  if (process.platform !== "darwin") return true;
  const darwinMajor = Number(os.release().split(".")[0] ?? 0);
  return darwinMajor >= 22;
}

if (process.env.NODE_ENV === "development" && supportsOpenNextDevRuntime()) {
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  async redirects() {
    return legacyConfigRedirects();
  },
  turbopack: {
    root: import.meta.dirname,
  },
  // Studio 用プレビュー env（npm run studio / sanity.config 向け。本番 Worker には /studio ルートなし）
  env: {
    SANITY_STUDIO_PREVIEW_URL:
      process.env.SANITY_STUDIO_PREVIEW_URL || "http://localhost:3000",
    SANITY_STUDIO_PREVIEW_SECRET:
      process.env.SANITY_STUDIO_PREVIEW_SECRET ||
      process.env.SANITY_PREVIEW_SECRET ||
      "",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "sonocafe.xyz",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

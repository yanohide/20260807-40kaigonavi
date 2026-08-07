import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

import { client, sanityConfigured } from "./client";

const builder = sanityConfigured ? createImageUrlBuilder(client) : null;

/**
 * Sanity の image 値から画像 URL ビルダーを返す。
 * 未設定時や値が無い場合は null を返すので、呼び出し側でフォールバックする。
 * Markdown 由来の `{ src: "https://..." }`（asset 無し）はビルドせず null。
 */
export function urlForImage(source?: SanityImageSource | null) {
  if (!builder || !source) return null;
  if (
    typeof source === "object" &&
    source !== null &&
    "src" in source &&
    !("asset" in source)
  ) {
    return null;
  }
  try {
    return builder.image(source);
  } catch {
    return null;
  }
}

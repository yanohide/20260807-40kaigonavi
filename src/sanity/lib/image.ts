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
    !(source as { asset?: unknown }).asset
  ) {
    // GROQ の asset->{...} 展開により asset: null が付与されることがあるため、
    // キーの有無ではなく値の真偽で判定する。
    return null;
  }
  try {
    return builder.image(source);
  } catch {
    return null;
  }
}

/**
 * `{ src: "/images/..." }`（public 配下のローカルパス、asset 無し）を
 * そのまま返す。Sanity アセットではない画像（移行済みの記事画像等）用。
 */
export function localSrcOf(source?: SanityImageSource | null): string | null {
  if (!source || typeof source !== "object") return null;
  const src = (source as { src?: unknown }).src;
  return typeof src === "string" && src.startsWith("/") ? src : null;
}

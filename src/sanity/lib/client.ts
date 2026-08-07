import { draftMode } from "next/headers";
import { createClient, type QueryParams } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

export const sanityConfigured =
  typeof projectId === "string" && projectId.trim().length > 0;

const baseConfig = sanityConfigured
  ? {
      projectId: projectId!.trim(),
      dataset: dataset?.trim()?.length ? dataset : "production",
      apiVersion: "2024-01-01",
    }
  : null;

export const client = baseConfig
  ? createClient({
      ...baseConfig,
      // 入稿直後の `next build` / 本番静的生成で CDN 遅れを踏まない
      // （useCdn:true だと再入稿した本文画像がビルドに乗らないことがある）
      useCdn: false,
    })
  : null!;

// 下書きプレビュー用トークン。read 権限の専用トークンを推奨するが、
// 未設定なら書き込みトークンを流用する（read 権限を含むため）。
const previewToken =
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_TOKEN;

// 下書き（未公開）を読むためのクライアント。
// CDN を切り、token を付け、drafts パースペクティブで公開＋下書きを重ねて取得する。
const draftClient =
  baseConfig && previewToken
    ? createClient({
        ...baseConfig,
        useCdn: false,
        token: previewToken,
        perspective: "drafts",
        stega: false,
      })
    : null;

async function isDraftModeEnabled(): Promise<boolean> {
  // draftMode() はリクエストスコープ（RSC / Route Handler）でのみ使える。
  // generateStaticParams などスコープ外では例外になるので false 扱いにする。
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
}

export async function sanityFetch<T>({
  query,
  params = {},
  revalidate = 60,
  fallback,
}: {
  query: string;
  params?: QueryParams;
  revalidate?: number | false;
  fallback?: T;
}): Promise<T> {
  if (!sanityConfigured) {
    if (fallback !== undefined) return fallback;
    throw new Error("Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID.");
  }

  // Draft Mode 有効時は下書きを含む内容を、キャッシュせず取得する。
  if (draftClient && (await isDraftModeEnabled())) {
    try {
      return await draftClient.fetch<T>(query, params, {
        next: { revalidate: 0 },
      });
    } catch (error) {
      if (fallback !== undefined) return fallback;
      throw error;
    }
  }

  try {
    return await client.fetch<T>(query, params, {
      next: { revalidate },
    });
  } catch (error) {
    if (fallback !== undefined) return fallback;
    throw error;
  }
}

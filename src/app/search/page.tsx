import type { Metadata } from "next";

import { PostCard, type PostCardItem } from "@/components/PostCard";
import { sanityFetch } from "@/sanity/lib/client";
import { SEARCH_POSTS_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "検索結果",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const keyword = s?.trim() ?? "";

  const posts =
    keyword.length > 0
      ? await sanityFetch<PostCardItem[]>({
          query: SEARCH_POSTS_QUERY,
          params: { term: `*${keyword}*` },
          revalidate: false,
          fallback: [],
        })
      : [];

  return (
    <div className="page-shell page-shell--wide">
      <h1 className="section-heading">検索結果</h1>
      {keyword.length === 0 ? (
        <p className="tracking-[0.06em] text-[var(--color-muted)]">
          キーワードを入力して検索してください。
        </p>
      ) : posts.length === 0 ? (
        <p className="tracking-[0.06em] text-[var(--color-muted)]">
          「{keyword}」に一致する記事は見つかりませんでした。
        </p>
      ) : (
        <>
          <p className="mb-6 tracking-[0.06em] text-[var(--color-muted)]">
            「{keyword}」の検索結果：{posts.length}件
          </p>
          <div className="post-card-grid post-card-grid--home">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

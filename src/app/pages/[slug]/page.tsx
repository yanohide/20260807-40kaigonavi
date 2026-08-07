import type { Metadata } from "next";
import Link from "next/link";

import { PostCard, type PostCardItem } from "@/components/PostCard";
import {
  getAllHubSlugs,
  getHubBySlug,
  HUB_IMPL,
} from "@/lib/siteStructure";
import { sanityFetch } from "@/sanity/lib/client";
import { POSTS_BY_CATEGORY_QUERY } from "@/sanity/lib/queries";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  // site-structure.md の全 HUB slug（crypto / nft / metaverse / defi）
  return getAllHubSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hub = getHubBySlug(slug);
  if (!hub) return { title: "ページが見つかりません" };
  return {
    title: hub.title,
    description: hub.intro,
  };
}

export default async function HubPage({ params }: Props) {
  const { slug } = await params;
  const hub = getHubBySlug(slug);

  if (!hub) {
    return (
      <div className="page-shell">
        <h1 className="article-title">ハブが見つかりません</h1>
        <p className="tracking-[0.06em] text-[var(--color-muted)]">
          site-structure に無い slug です。
        </p>
        <Link href="/" className="profile-link">
          ← トップへ
        </Link>
      </div>
    );
  }

  const posts = await sanityFetch<PostCardItem[]>({
    query: POSTS_BY_CATEGORY_QUERY,
    params: { category: hub.category },
    revalidate: false,
    fallback: [],
  });

  const intro =
    HUB_IMPL === "A"
      ? hub.intro
      : hub.intro; /* B の場合は将来 Sanity Page から取得 */

  return (
    <div className="page-shell page-shell--wide">
      <Link
        href="/"
        className="text-sm tracking-[0.06em] text-[var(--color-muted)] hover:text-[var(--color-taupe-deep)]"
      >
        ← トップ
      </Link>

      <header className="hub-header">
        <p className="hub-eyebrow">カテゴリ · {hub.category}</p>
        <h1 className="article-title mt-2">{hub.title}</h1>
        <p className="hub-intro tracking-[0.06em] leading-[1.7] text-[var(--color-muted)]">
          {intro}
        </p>
      </header>

      <section className="mt-10">
        <h2 className="section-heading">このコーナーの記事</h2>
        {posts.length === 0 ? (
          <p className="tracking-[0.06em] text-[var(--color-muted)]">
            まだ「{hub.category}」カテゴリの記事がありません。Studio で Post の
            categories に「{hub.category}」を付けて Publish すると、ここにカードが表示されます。
          </p>
        ) : (
          <div className="post-card-grid">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

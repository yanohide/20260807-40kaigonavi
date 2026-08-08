import Image from "next/image";
import Link from "next/link";

import { OperatorProfileWidget } from "@/components/OperatorProfileWidget";
import { PostCard, type PostCardItem } from "@/components/PostCard";
import { SidebarPostPanel } from "@/components/SidebarPostPanel";
import { SidebarSearchForm } from "@/components/SidebarSearchForm";
import {
  HOME_ASSETS,
  HOME_POPULAR_POST_SLUGS,
  HOME_RECOMMENDED_POST_SLUGS,
  pickPostsBySlugs,
} from "@/lib/homeContent";
import { HUBS } from "@/lib/siteStructure";
import { sanityFetch } from "@/sanity/lib/client";
import { POSTS_QUERY } from "@/sanity/lib/queries";

export default async function HomePage() {
  const posts = await sanityFetch<PostCardItem[]>({
    query: POSTS_QUERY,
    // ビルド時に Sanity 公開記事を取得。Sanity で非公開にしたあとは再ビルド（git push）が必要。2026-08-05
    revalidate: false,
    fallback: [],
  });

  const latest = posts.slice(0, 6);
  const popularPosts = pickPostsBySlugs(posts, HOME_POPULAR_POST_SLUGS);
  const recommendedPosts = pickPostsBySlugs(posts, HOME_RECOMMENDED_POST_SLUGS);

  return (
    <>
      <section className="home-hero home-hero--wp" aria-label="メインビジュアル">
        <Image
          src={HOME_ASSETS.heroImage}
          alt="40歳からの介護ナビ"
          width={1600}
          height={500}
          priority
          sizes="100vw"
          className="home-hero-wp-img"
        />
      </section>

      <div className="page-shell page-shell--wide">
        <div className="home-layout">
          <section className="home-main">
            <h2 className="section-heading">新着記事</h2>
            {latest.length === 0 ? (
              <p className="tracking-[0.06em] text-[var(--color-muted)]">
                まだ記事がありません。Sanity Studio で投稿するか、upload:sanity-publish
                で追加してください。
              </p>
            ) : (
              <div className="post-card-grid post-card-grid--home">
                {latest.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </section>

          <aside className="home-sidebar">
            <SidebarSearchForm />
            <OperatorProfileWidget />
            <SidebarPostPanel title="人気記事" posts={popularPosts} />
            <SidebarPostPanel title="おすすめ記事" posts={recommendedPosts} />
            <div className="profile-panel">
              <h2 className="section-heading">カテゴリー</h2>
              <ul className="hub-link-list">
                {HUBS.map((hub) => (
                  <li key={hub.slug}>
                    <Link href={`/pages/${hub.slug}`}>{hub.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

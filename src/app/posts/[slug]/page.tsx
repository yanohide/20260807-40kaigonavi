import type { PortableTextBlock } from "@portabletext/react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PostBody } from "@/components/PostBody";
import { formatDateJa } from "@/lib/formatDate";
import { sanityFetch } from "@/sanity/lib/client";
import { urlForImage } from "@/sanity/lib/image";
import { POST_QUERY, POST_SLUGS_QUERY } from "@/sanity/lib/queries";

type Post = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  heroImage?: {
    asset?: { _ref?: string };
    alt?: string;
  } | null;
  body?: PortableTextBlock[];
};

type SlugRow = { slug: string };

export async function generateStaticParams() {
  const slugs = await sanityFetch<SlugRow[]>({
    query: POST_SLUGS_QUERY,
    revalidate: false,
    fallback: [],
  });

  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await sanityFetch<Post | null>({
    query: POST_QUERY,
    params: { slug },
    revalidate: false,
    fallback: null,
  });

  if (!post) return { title: "記事が見つかりません" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await sanityFetch<Post | null>({
    query: POST_QUERY,
    params: { slug },
    revalidate: false,
    fallback: null,
  });

  // notFound() は Turbopack 開発時に Performance.measure の負時刻エラーを
  // 誘発しやすいため、同一ページ内で不足表示にする。
  if (!post) {
    return (
      <article className="page-shell article-shell">
        <Link
          href="/posts"
          className="text-sm tracking-[0.06em] text-[var(--color-muted)] hover:text-[var(--color-taupe-deep)]"
        >
          ← 記事一覧
        </Link>
        <h1 className="article-title mt-6">記事が見つかりません</h1>
        <p className="tracking-[0.06em] text-[var(--color-muted)]">
          公開されていないか、URL が間違っている可能性があります。
        </p>
      </article>
    );
  }

  const heroUrl =
    urlForImage(post.heroImage)?.width(1200).height(675).fit("crop").url() ??
    null;

  return (
    <article className="page-shell article-shell">
      <Link
        href="/posts"
        className="text-sm tracking-[0.06em] text-[var(--color-muted)] hover:text-[var(--color-taupe-deep)]"
      >
        ← 記事一覧
      </Link>
      <h1 className="article-title mt-6">{post.title}</h1>
      {heroUrl ? (
        <figure className="article-hero">
          <Image
            src={heroUrl}
            alt={post.heroImage?.alt || post.title}
            width={1200}
            height={675}
            className="article-hero-img"
            priority
          />
        </figure>
      ) : null}
      <p className="article-date">{formatDateJa(post.publishedAt)}</p>
      <div className="prose-blog max-w-none">
        {post.body?.length ? <PostBody value={post.body} /> : null}
      </div>
    </article>
  );
}

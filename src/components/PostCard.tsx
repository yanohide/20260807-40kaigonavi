import Link from "next/link";

import { formatDateJa } from "@/lib/formatDate";
import { urlForImage } from "@/sanity/lib/image";

export type PostCardItem = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  heroImage?: {
    asset?: { _ref?: string };
    alt?: string;
  } | null;
};

export function PostCard({ post }: { post: PostCardItem }) {
  const imageUrl = post.heroImage
    ? urlForImage(post.heroImage)?.width(640).height(360).url()
    : null;

  return (
    <Link href={`/posts/${post.slug.current}`} className="post-card">
      <div className="post-card-media">
        <div className="post-card-media-frame">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={post.heroImage?.alt || post.title}
              width={640}
              height={360}
            />
          ) : (
            <div className="post-card-placeholder" aria-hidden="true" />
          )}
        </div>
      </div>
      <div className="post-card-body">
        <h3 className="post-card-title">{post.title}</h3>
        {post.excerpt ? <p className="post-card-excerpt">{post.excerpt}</p> : null}
        <time className="post-meta" dateTime={post.publishedAt}>
          {formatDateJa(post.publishedAt)}
        </time>
      </div>
    </Link>
  );
}

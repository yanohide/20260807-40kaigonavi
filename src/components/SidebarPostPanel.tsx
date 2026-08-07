import Link from "next/link";

import { urlForImage } from "@/sanity/lib/image";

export type SidebarPostItem = {
  _id: string;
  title: string;
  slug: { current: string };
  heroImage?: {
    asset?: { _ref?: string };
    alt?: string;
  } | null;
};

type SidebarPostPanelProps = {
  title: string;
  posts: SidebarPostItem[];
};

export function SidebarPostPanel({ title, posts }: SidebarPostPanelProps) {
  if (posts.length === 0) return null;

  return (
    <div className="sidebar-post-panel">
      <h2 className="section-heading">{title}</h2>
      <ul className="sidebar-post-list">
        {posts.map((post) => {
          const imageUrl = post.heroImage
            ? urlForImage(post.heroImage)?.width(320).height(180).url()
            : null;

          return (
            <li key={post._id}>
              <Link
                href={`/posts/${post.slug.current}`}
                className="sidebar-post-link"
              >
                <div className="sidebar-post-thumb">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={post.heroImage?.alt || post.title}
                      width={320}
                      height={180}
                      loading="lazy"
                    />
                  ) : (
                    <div className="sidebar-post-thumb-placeholder" aria-hidden="true" />
                  )}
                </div>
                <p className="sidebar-post-title">{post.title}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import Link from "next/link";

import { formatDateJa } from "@/lib/formatDate";
import { sanityFetch } from "@/sanity/lib/client";
import { POSTS_QUERY } from "@/sanity/lib/queries";

type PostListItem = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
};

export default async function PostsPage() {
  const posts = await sanityFetch<PostListItem[]>({
    query: POSTS_QUERY,
    revalidate: false,
    fallback: [],
  });

  return (
    <div className="page-shell">
      <h1 className="article-title">記事一覧</h1>
      <ul className="post-list mt-8">
        {posts.map((post, index) => (
          <li key={post._id} className="post-list-item">
            <span className="post-list-number">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <Link href={`/posts/${post.slug.current}`}>{post.title}</Link>
              <p className="post-meta">{formatDateJa(post.publishedAt)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

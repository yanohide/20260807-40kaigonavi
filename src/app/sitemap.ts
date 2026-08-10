import type { MetadataRoute } from "next";

import { getAllHubSlugs } from "@/lib/siteStructure";
import { getSiteUrl } from "@/lib/siteUrl";
import { sanityFetch } from "@/sanity/lib/client";
import { SITEMAP_POSTS_QUERY } from "@/sanity/lib/queries";

type SitemapPost = {
  slug: string;
  publishedAt?: string | null;
  _updatedAt?: string | null;
};

function absoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}

function toLastModified(iso?: string | null): Date {
  if (iso) {
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await sanityFetch<SitemapPost[]>({
    query: SITEMAP_POSTS_QUERY,
    revalidate: false,
    fallback: [],
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/posts"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const hubPages: MetadataRoute.Sitemap = getAllHubSlugs().map((slug) => ({
    url: absoluteUrl(`/pages/${slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/posts/${post.slug}`),
    lastModified: toLastModified(post._updatedAt ?? post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...hubPages, ...postPages];
}

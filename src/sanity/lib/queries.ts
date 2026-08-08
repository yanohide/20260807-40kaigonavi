import { defineQuery } from "next-sanity";

export const POSTS_QUERY = defineQuery(
  `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    categories,
    heroImage
  }`,
);

export const POSTS_BY_CATEGORY_QUERY = defineQuery(
  `*[_type == "post" && $category in categories] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    categories,
    heroImage
  }`,
);

export const POST_QUERY = defineQuery(
  `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    categories,
    heroImage,
    body[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url,
          originalFilename,
          metadata { dimensions }
        }
      }
    }
  }`,
);

export const POST_SLUGS_QUERY = defineQuery(
  `*[_type == "post" && defined(slug.current)] {
    "slug": slug.current
  }`,
);

/** サイトマップ用：公開日時付きの slug 一覧 */
export const SEARCH_POSTS_QUERY = defineQuery(
  `*[_type == "post" && (
    title match $term ||
    excerpt match $term
  )] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    categories,
    heroImage
  }`,
);

export const SITEMAP_POSTS_QUERY = defineQuery(
  `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    "slug": slug.current,
    publishedAt,
    _updatedAt
  }`,
);

import type { SanityImageSource } from "@sanity/image-url";

import { urlForImage } from "@/sanity/lib/image";

export type RelatedArticleCardValue = {
  label?: string;
  title?: string;
  url?: string;
  excerpt?: string;
  image?: (SanityImageSource & { alt?: string; src?: string }) | null;
};

function CheckIcon() {
  return (
    <svg
      className="related-article-card-check"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M6.2 11.4 2.8 8l1.1-1.1 2.3 2.3 5.9-5.9L13.2 4.4 6.2 11.4Z"
      />
    </svg>
  );
}

/**
 * WP「あわせて読みたい」相当の関連記事カード。
 * 枠上辺にラベルを挟み、サムネ左・テキスト右の横並び。
 */
export function RelatedArticleCard({
  value,
}: {
  value?: RelatedArticleCardValue;
}) {
  const { label, title, url, image } = value ?? {};
  if (!title?.trim() || !url?.trim()) return null;

  const sanitySrc =
    urlForImage(image)?.width(320).height(180).fit("crop").url() ?? null;
  const externalSrc =
    typeof image?.src === "string" && /^https?:\/\//i.test(image.src)
      ? image.src
      : null;
  const imageUrl = sanitySrc || externalSrc;
  const alt = image?.alt || title;
  const isInternal = url.startsWith("/");
  const labelText = label?.trim() || "あわせて読みたい";

  return (
    <aside className="related-article-card my-10 not-prose">
      <a
        href={url}
        className="related-article-card-link"
        {...(isInternal
          ? {}
          : { target: "_blank", rel: "noopener noreferrer" })}
      >
        <span className="related-article-card-label">
          <CheckIcon />
          {labelText}
        </span>
        <div className="related-article-card-inner">
          <div className="related-article-card-media">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- カードは Sanity / 外部 URL 両対応
              <img src={imageUrl} alt={alt} width={320} height={180} />
            ) : (
              <div
                className="related-article-card-placeholder"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="related-article-card-body">
            <p className="related-article-card-title">{title}</p>
          </div>
        </div>
      </a>
    </aside>
  );
}

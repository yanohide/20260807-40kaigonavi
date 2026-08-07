import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Image from "next/image";
import type { ReactNode } from "react";

import { PortableLink } from "@/components/portableText/PortableLink";
import type {
  AppReachCardBlock,
  AppReachStoreBadge,
} from "@/lib/promoteAppReachBlocks";
import { urlForImage } from "@/sanity/lib/image";

type ImageBlock = {
  _key?: string;
  alt?: string;
  src?: string;
  asset?: {
    metadata?: { dimensions?: { width?: number; height?: number } };
  };
};

function resolveImageSrc(image?: ImageBlock | null): string | null {
  if (!image) return null;
  const sanitySrc = urlForImage(image)?.width(256).height(256).url() ?? null;
  const externalSrc =
    typeof image.src === "string" && /^https?:\/\//i.test(image.src)
      ? image.src
      : null;
  return sanitySrc || externalSrc;
}

const inlinePortableComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <span>{children}</span>
    ),
  },
  marks: {
    link: PortableLink,
  },
};

function AppReachImage({
  image,
  className,
  width,
  height,
  href,
}: {
  image?: ImageBlock | null;
  className?: string;
  width: number;
  height: number;
  href?: string;
}) {
  const src = resolveImageSrc(image);
  if (!src || !image) return null;
  const alt = image.alt || "";
  const sanitySrc = urlForImage(image)?.width(width).height(height).url();
  const img = sanitySrc ? (
    <Image
      src={sanitySrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- 外部 URL
    <img src={src} alt={alt} width={width} height={height} className={className} />
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block no-underline"
      >
        {img}
      </a>
    );
  }

  return img;
}

function normalizeCard(value?: AppReachCardBlock) {
  if (!value) return null;

  if (value.title && value.meta) {
    return {
      title: value.title,
      meta: value.meta,
      appReachLabel: value.appReachLabel || "アプリーチ",
      appReachUrl: value.appReachUrl,
      icon: value.icon,
      storeBadges: value.storeBadges || [],
      titleBlock: undefined,
      metaBlock: undefined,
      storeLinksBlock: undefined,
      legacyStoreImages: [] as ImageBlock[],
    };
  }

  if (value.titleBlock && value.metaBlock) {
    return {
      title: undefined as string | undefined,
      meta: undefined as string | undefined,
      appReachLabel: "アプリーチ",
      appReachUrl: undefined as string | undefined,
      icon: value.icon,
      storeBadges: [] as AppReachStoreBadge[],
      titleBlock: value.titleBlock,
      metaBlock: value.metaBlock,
      storeLinksBlock: value.storeLinksBlock,
      legacyStoreImages: value.storeImages || [],
    };
  }

  return null;
}

/**
 * WP「アプリーチ」相当：左にアイコン、中央にテキスト、右端にストアバッジ。
 */
export function AppReachCard({ value }: { value?: AppReachCardBlock }) {
  const card = normalizeCard(value);
  if (!card) return null;

  const {
    title,
    meta,
    appReachLabel,
    appReachUrl,
    icon,
    storeBadges,
    titleBlock,
    metaBlock,
    storeLinksBlock,
    legacyStoreImages,
  } = card;

  const badgeImages: AppReachStoreBadge[] =
    storeBadges.length > 0
      ? storeBadges
      : legacyStoreImages.map((image) => ({ image }));

  return (
    <aside className="app-reach-card not-prose" aria-label="アプリ紹介">
      <div className="app-reach-card-inner">
        {icon ? (
          <div className="app-reach-card-icon">
            <AppReachImage
              image={icon}
              width={88}
              height={88}
              className="app-reach-card-icon-img"
            />
          </div>
        ) : null}
        <div className="app-reach-card-body">
          <p className="app-reach-card-title">
            {title ? (
              title
            ) : titleBlock ? (
              <PortableText
                value={[titleBlock as PortableTextBlock]}
                components={inlinePortableComponents}
              />
            ) : null}
          </p>
          <p className="app-reach-card-meta">
            {meta ? (
              <>
                {meta}
                {appReachUrl ? (
                  <>
                    <a
                      href={appReachUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-link)] underline underline-offset-[3px]"
                    >
                      {appReachLabel}
                    </a>
                  </>
                ) : null}
              </>
            ) : metaBlock ? (
              <PortableText
                value={[metaBlock as PortableTextBlock]}
                components={inlinePortableComponents}
              />
            ) : null}
          </p>
          {storeLinksBlock && badgeImages.length === 0 ? (
            <p className="app-reach-card-store-links">
              <PortableText
                value={[storeLinksBlock as PortableTextBlock]}
                components={inlinePortableComponents}
              />
            </p>
          ) : null}
        </div>
        {badgeImages.length ? (
          <div className="app-reach-card-stores">
            {badgeImages.map((badge, index) => (
              <AppReachImage
                key={badge.image?._key || badge.url || `store-${index}`}
                image={badge.image}
                href={badge.url}
                width={120}
                height={40}
                className="app-reach-card-store-img"
              />
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

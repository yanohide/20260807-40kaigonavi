import { type PortableTextComponents } from "@portabletext/react";
import { toPlainText } from "@portabletext/toolkit";
import Image from "next/image";

import { AccordionBlock } from "@/components/blocks/AccordionBlock";
import { AppReachCard } from "@/components/blocks/AppReachCard";
import { CustomButton } from "@/components/blocks/CustomButton";
import { QaBlock } from "@/components/blocks/QaBlock";
import { RelatedArticleCard } from "@/components/blocks/RelatedArticleCard";
import { SpeechBubble } from "@/components/blocks/SpeechBubble";
import { TableBlock } from "@/components/blocks/TableBlock";
import { TitledFrame } from "@/components/blocks/TitledFrame";
import { PortableLink } from "@/components/portableText/PortableLink";
import { toHeadingId } from "@/lib/headingId";
import { shouldHideStandaloneAppIconImage } from "@/lib/promoteAppReachBlocks";
import { urlForImage } from "@/sanity/lib/image";

/**
 * 記事本文および装飾ブロック内のリッチテキストで共通して使う
 * Portable Text レンダラー（見出し・引用・リスト・リンク・画像）。
 */
export const basePortableComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-0 mt-[1.15rem] first:mt-0 tracking-[0.06em] leading-[1.55] text-[var(--color-ink)]">
        {children}
      </p>
    ),
    h2: ({ children, value }) => {
      const id = toHeadingId(toPlainText(value ? [value] : []));
      return (
        <h2 id={id || undefined} className="section-bar !mt-11 !mb-5">
          {children}
        </h2>
      );
    },
    h3: ({ children, value }) => {
      const id = toHeadingId(toPlainText(value ? [value] : []));
      return (
        <h3
          id={id || undefined}
          className="relative mt-8 mb-3 pb-1.5 text-[1.05rem] font-bold tracking-[0.06em] text-[#2c3e6b] after:absolute after:bottom-0 after:left-0 after:h-1 after:w-1/4 after:bg-[#2c3e6b] after:content-['']"
        >
          {children}
        </h3>
      );
    },
    h4: ({ children }) => (
      <h4 className="relative mt-6 mb-2 pl-3 text-[1rem] font-bold tracking-[0.06em] text-[#2c3e6b] before:absolute before:left-0 before:top-[0.15em] before:bottom-[0.15em] before:w-1 before:rounded-sm before:bg-[#2c3e6b] before:content-['']">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mb-0 mt-[1.15rem] first:mt-0 border-l-4 border-[var(--color-taupe)] bg-[var(--color-surface)] py-3 pl-4 pr-3 tracking-[0.06em] leading-[1.55] text-[var(--color-muted)]">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-0 mt-[1.15rem] first:mt-0 list-disc space-y-2 pl-6 tracking-[0.06em] leading-[1.55]">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-0 mt-[1.15rem] first:mt-0 list-decimal space-y-2 pl-6 tracking-[0.06em] leading-[1.55]">
        {children}
      </ol>
    ),
  },
  marks: {
    link: PortableLink,
  },
  types: {
    image: ({ value }) => {
      const alt = (value?.alt as string) || "";
      const externalSrc =
        typeof value?.src === "string" && /^https?:\/\//i.test(value.src)
          ? value.src
          : null;
      const sanitySrc = urlForImage(value)?.width(1200).url() ?? null;
      const src = sanitySrc || externalSrc;
      if (!src) return null;

      // アフィリエイト計測ピクセル等は表示しない
      if (/\/0\.gif(?:\?|$)/i.test(src) || /a8\.net\/svt\/bgt/i.test(src)) {
        return null;
      }

      // 小さい装飾イラスト（吹き出しアイコン等）を全幅で拡大しない
      const asset = (
        value as {
          asset?: {
            originalFilename?: string;
            metadata?: { dimensions?: { width?: number; height?: number } };
          };
        }
      )?.asset;
      const file = String(asset?.originalFilename || src);
      const w = Number(asset?.metadata?.dimensions?.width) || 0;
      const h = Number(asset?.metadata?.dimensions?.height) || 0;
      if (w > 0 && h > 0 && w <= 200 && h <= 200) return null;
      if (
        /-150x150\./i.test(file) ||
        /(?:^|\/)(?:kaisya_|fukidashi|questioner-)/i.test(file)
      ) {
        return null;
      }
      if (shouldHideStandaloneAppIconImage(value)) return null;

      const intrinsicW = w > 0 ? w : 1200;
      const intrinsicH = h > 0 ? h : 675;
      const requestW = w > 0 ? Math.min(w, 1200) : 1200;
      const optimizedSrc =
        urlForImage(value)?.width(requestW).url() ?? sanitySrc;

      return (
        <figure className="my-8">
          {optimizedSrc ? (
            <Image
              src={optimizedSrc}
              alt={alt}
              width={intrinsicW}
              height={intrinsicH}
              sizes="(max-width: 42rem) 100vw, 42rem"
              className="mx-auto block h-auto w-auto max-w-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- WP/外部 URL（Sanity asset 未登録）
            <img
              src={src}
              alt={alt}
              width={intrinsicW}
              height={intrinsicH}
              className="mx-auto block h-auto w-auto max-w-full"
            />
          )}
        </figure>
      );
    },
  },
};

/**
 * 囲み枠・Q&A 回答などネスト内用。
 * 装飾ブロックを描画する（qaBlock は再帰防止のため含めない）。
 */
export const nestedPortableComponents: PortableTextComponents = {
  ...basePortableComponents,
  types: {
    ...basePortableComponents.types,
    table: TableBlock,
    speechBubble: SpeechBubble,
    titledFrame: TitledFrame,
    customButton: CustomButton,
    accordionBlock: AccordionBlock,
    relatedArticleCard: RelatedArticleCard,
  },
};

/**
 * 記事本文（トップレベル）用の PortableText 設定。
 * 箇条書きは入稿時に titledFrame へ変換済み
 * （リード／H2直下=band、H3内=edge）。
 * 囲み枠・Q&A 内のリストは base のまま（二重枠にしない）。
 */
export const postPortableComponents: PortableTextComponents = {
  ...nestedPortableComponents,
  types: {
    ...nestedPortableComponents.types,
    qaBlock: QaBlock,
    appReachCard: AppReachCard,
  },
};

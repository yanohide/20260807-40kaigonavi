import {
  PortableText,
  type PortableTextComponents,
} from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { toPlainText } from "@portabletext/toolkit";
import type { SanityImageSource } from "@sanity/image-url";
import Image from "next/image";

import { nestedPortableComponents } from "@/components/portableText/baseComponents";
import { tocHrefForLabel } from "@/lib/headingId";
import {
  OPERATOR_AVATAR,
  OPERATOR_PROFILE_LINES,
  OPERATOR_PROFILE_NAME,
} from "@/lib/operatorProfile";
import { urlForImage } from "@/sanity/lib/image";

export type TitledFrameStyle = "band" | "edge";

export type TitledFrameValue = {
  title?: string;
  style?: TitledFrameStyle | "info" | "warning" | "memo";
  body?: PortableTextBlock[];
  /** 右半分に表示する丸アイコン（プロフィール枠など） */
  avatar?: SanityImageSource | null;
  /** 丸アイコン下の名前など */
  avatarCaption?: string | null;
};

const NAVY = "#2c3e6b";
const AVATAR_SIZE = 168;

function isOperatorProfileFrame(
  title?: string,
  caption?: string | null,
): boolean {
  const t = String(title || "");
  const c = String(caption || "");
  return (
    t.includes("サイト運営者") ||
    /ヤノヒデ|矢野英人|ひよこ忍者/.test(c)
  );
}

function FrameAvatar({
  avatar,
  caption,
  forceLocalYanohide = false,
}: {
  avatar: SanityImageSource;
  caption?: string | null;
  forceLocalYanohide?: boolean;
}) {
  const sanitySrc =
    urlForImage(avatar)?.width(AVATAR_SIZE * 2).height(AVATAR_SIZE * 2).url() ??
    null;
  const src = forceLocalYanohide ? OPERATOR_AVATAR : sanitySrc;
  if (!src) return null;

  return (
    <div className="flex w-full shrink-0 flex-col items-center justify-center gap-2 sm:w-1/2">
      <div
        className="frame-avatar relative aspect-square overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]"
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
      >
        <Image
          src={src}
          alt={caption?.trim() || ""}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          className="frame-avatar-img h-full w-full rounded-full object-cover"
        />
      </div>
      {caption?.trim() ? (
        <p className="frame-avatar-caption m-0 text-center text-sm font-bold tracking-[0.06em] text-[var(--color-ink)]">
          {caption.trim()}
        </p>
      ) : null}
    </div>
  );
}

function resolveStyle(
  style: TitledFrameValue["style"],
): "band" | "edge" {
  if (style === "edge") return "edge";
  return "band";
}

function isTocFrame(title?: string) {
  const t = String(title || "").replace(/\s+/g, "");
  return t.includes("本記事の内容") || t.includes("目次");
}

/** 「本記事の内容」枠：各箇条書きを見出しアンカーへリンク */
function tocFrameComponents(): PortableTextComponents {
  return {
    ...nestedPortableComponents,
    // WP由来の [文言](#旧アンカー) が残っていると <a> が二重になるため、内側リンクはテキストだけにする
    marks: {
      ...nestedPortableComponents.marks,
      link: ({ children }) => <>{children}</>,
    },
    listItem: {
      bullet: ({ children, value }) => {
        const label = toPlainText(value ? [value] : []).trim();
        return (
          <li className="tracking-[0.06em] leading-[1.55]">
            <a
              href={tocHrefForLabel(label)}
              className="text-[var(--color-link)] underline underline-offset-[3px]"
            >
              {children}
            </a>
          </li>
        );
      },
      number: ({ children }) => <li>{children}</li>,
    },
  };
}

/**
 * キャプション付き囲み枠。
 * - band: タイトル帯を枠の上辺に接して左寄せ（紺帯・白文字）
 * - edge: タイトルを枠上辺に挟んで左寄せ（白地・紺文字）
 * avatar があるときは本文左・丸画像右の2カラム。
 */
export function TitledFrame({ value }: { value?: TitledFrameValue }) {
  const { title, body, avatar, avatarCaption } = value ?? {};
  const style = resolveStyle(value?.style);
  const isOperator = isOperatorProfileFrame(title, avatarCaption);
  const displayCaption = isOperator ? OPERATOR_PROFILE_NAME : avatarCaption;
  const avatarEl = avatar || isOperator ? (
    <FrameAvatar
      avatar={avatar ?? {}}
      caption={displayCaption}
      forceLocalYanohide={isOperator}
    />
  ) : null;
  const ptComponents = isTocFrame(title)
    ? tocFrameComponents()
    : nestedPortableComponents;

  const bodyEl = (
    <div
      className={`min-w-0 tracking-[0.06em] leading-[1.55] text-[var(--color-ink)] ${
        avatarEl ? "sm:w-1/2" : ""
      }`}
    >
      {isOperator ? (
        <ul className="m-0 list-disc space-y-1 pl-5">
          {OPERATOR_PROFILE_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        body &&
        body.length > 0 && (
          <PortableText value={body} components={ptComponents} />
        )
      )}
    </div>
  );

  const inner = avatarEl ? (
    <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-center">
      {bodyEl}
      {avatarEl}
    </div>
  ) : (
    bodyEl
  );

  if (style === "edge") {
    return (
      <div
        className="titled-frame relative my-10 border-2 bg-white px-5 py-5 pt-6"
        style={{ borderColor: NAVY }}
      >
        {title ? (
          <span
            className="absolute left-4 top-0 -translate-y-1/2 bg-white px-2.5 text-sm font-bold tracking-[0.06em]"
            style={{ color: NAVY }}
          >
            {title}
          </span>
        ) : null}
        {inner}
      </div>
    );
  }

  return (
    <div className="titled-frame my-10">
      {title ? (
        <div className="flex justify-start">
          <span
            className="px-3 py-0.5 text-sm font-bold tracking-[0.06em] text-white"
            style={{ backgroundColor: NAVY }}
          >
            {title}
          </span>
        </div>
      ) : null}
      <div className="border-2 bg-white px-5 py-5" style={{ borderColor: NAVY }}>
        {inner}
      </div>
    </div>
  );
}

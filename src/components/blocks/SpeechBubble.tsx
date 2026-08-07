import Image from "next/image";
import type { SanityImageSource } from "@sanity/image-url";

import {
  isOperatorSpeechSpeaker,
  OPERATOR_AVATAR,
  operatorSpeechDisplayName,
} from "@/lib/operatorProfile";
import { urlForImage } from "@/sanity/lib/image";

export type SpeechBubbleValue = {
  _key?: string;
  speaker?: string | null;
  icon?: SanityImageSource | null;
  position?: "left" | "right";
  text?: string;
};

const ICON_SIZE = 72;

/** 質問者アイコン3パターン（表示はキーから決定＝SSR/CSRで一致） */
const QUESTIONER_AVATARS = [
  "/avatars/questioner-a.png",
  "/avatars/questioner-b.png",
  "/avatars/questioner-c.png",
] as const;

function hashPick(seed: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % modulo;
}

function defaultAvatarFor(value?: SpeechBubbleValue) {
  const seed = `${value?._key || ""}|${value?.text || ""}`;
  return QUESTIONER_AVATARS[hashPick(seed, QUESTIONER_AVATARS.length)];
}

/**
 * 吹き出し。左＝質問者、右＝ひよこ忍者（運営者）。
 * しっぽは三日月の先端のようなカーブした尖りで、アイコン方向へ伸ばす。
 */
export function SpeechBubble({ value }: { value?: SpeechBubbleValue }) {
  const { icon, text } = value ?? {};
  const isOperator = isOperatorSpeechSpeaker(value?.speaker, value?.position);
  const speaker = operatorSpeechDisplayName(value?.speaker, value?.position);
  const isRight = isOperator || value?.position === "right";
  const sanityIconUrl =
    urlForImage(icon)?.width(ICON_SIZE * 2).height(ICON_SIZE * 2).fit("crop").url() ??
    null;
  const iconUrl = isOperator
    ? OPERATOR_AVATAR
    : sanityIconUrl || defaultAvatarFor(value);

  return (
    <div
      className={`speech-bubble not-prose my-8 flex w-3/4 max-w-full items-end gap-3 ${
        isRight ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
      }`}
    >
      <div className="flex w-[72px] shrink-0 flex-col items-center gap-1">
        <div
          className="speech-bubble-icon relative z-10 overflow-hidden rounded-full border border-[var(--color-bubble-border)] bg-[var(--color-cream-deep)]"
          style={{ width: ICON_SIZE, height: ICON_SIZE, minWidth: ICON_SIZE }}
        >
          <Image
            src={iconUrl}
            alt={speaker}
            width={ICON_SIZE}
            height={ICON_SIZE}
            className="!m-0 !h-full !w-full rounded-full object-cover"
            style={{ width: ICON_SIZE, height: ICON_SIZE, objectFit: "cover" }}
          />
        </div>
        <span className="max-w-[5.5rem] truncate text-center text-[0.7rem] tracking-[0.04em] text-[var(--color-muted)]">
          {speaker}
        </span>
      </div>

      <div
        className={`speech-bubble-body relative z-0 min-w-0 flex-1 border border-[var(--color-bubble-border)] bg-[var(--color-bubble)] px-5 py-3 text-[0.95rem] leading-[1.85] tracking-[0.06em] text-[var(--color-ink)] ${
          isRight ? "border-r-0" : "border-l-0"
        }`}
      >
        {/* 三日月の先端のようなカーブしっぽ */}
        <svg
          className="pointer-events-none absolute top-1/2 z-[1]"
          width="20"
          height="32"
          viewBox="0 0 20 32"
          aria-hidden="true"
          style={
            isRight
              ? { right: -1, transform: "translate(70%, -50%)" }
              : { left: -1, transform: "translate(-70%, -50%)" }
          }
        >
          {isRight ? (
            <path
              d="M0 2
                 C 7 7, 14 11, 19.5 16
                 C 14 21, 7 25, 0 30
                 C 5.5 23, 5.5 9, 0 2
                 Z"
              fill="var(--color-bubble)"
            />
          ) : (
            <path
              d="M20 2
                 C 13 7, 6 11, 0.5 16
                 C 6 21, 13 25, 20 30
                 C 14.5 23, 14.5 9, 20 2
                 Z"
              fill="var(--color-bubble)"
            />
          )}
        </svg>
        <p className="relative z-[2] m-0 whitespace-pre-line">
          {(text ?? "").replace(/\n+$/g, "")}
        </p>
      </div>
    </div>
  );
}

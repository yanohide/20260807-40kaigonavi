import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

import { nestedPortableComponents, basePortableComponents } from "@/components/portableText/baseComponents";

export type QaItem = {
  _key?: string;
  question?: string;
  summary?: string;
  answer?: PortableTextBlock[];
};

export type QaBlockValue = {
  items?: QaItem[];
};

/** モジュール初期化時の循環参照を避けるため、初回描画時に組み立てる */
let qaAnswerComponents: PortableTextComponents | null = null;

function getQaAnswerComponents(): PortableTextComponents {
  if (!qaAnswerComponents) {
    qaAnswerComponents = {
      ...nestedPortableComponents,
      block: {
        ...basePortableComponents.block,
        normal: ({ children, index }) => (
          <p
            className={
              index === 0
                ? "!m-0 tracking-[0.06em] leading-[1.7] text-[var(--color-ink)]"
                : "mb-0 mt-[1.15rem] tracking-[0.06em] leading-[1.55] text-[var(--color-ink)]"
            }
          >
            {children}
          </p>
        ),
      },
    } as PortableTextComponents;
  }
  return qaAnswerComponents;
}

/** Q = 質問、A = 回答（＋任意の詳細本文） */
export function QaBlock({ value }: { value?: QaBlockValue }) {
  const items = value?.items ?? [];
  if (items.length === 0) return null;

  const answerComponents = getQaAnswerComponents();

  return (
    <div className="my-8 space-y-4">
      {items.map((item, index) => {
        const hasAnswerText = Boolean(item.summary?.trim());
        const hasAnswerBody = Boolean(item.answer && item.answer.length > 0);

        return (
          <div
            key={item._key ?? index}
            className="overflow-hidden border border-[var(--color-line)] bg-white"
          >
            <div className="flex items-start gap-2.5 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
              <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e53935] text-sm font-bold leading-none text-white">
                Q
              </span>
              <div className="min-w-0 flex-1 tracking-[0.06em]">
                <p className="!m-0 font-bold leading-[1.7] text-[var(--color-ink)]">
                  {item.question}
                </p>
              </div>
            </div>

            {(hasAnswerText || hasAnswerBody) && (
              <div className="flex items-start gap-2.5 px-5 py-4">
                <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e88e5] text-sm font-bold leading-none text-white">
                  A
                </span>
                <div className="qa-answer-body min-w-0 flex-1 tracking-[0.06em] leading-[1.55] text-[var(--color-ink)]">
                  {hasAnswerText ? (
                    <p className="!m-0 leading-[1.7] text-[var(--color-ink)]">
                      {item.summary}
                    </p>
                  ) : null}
                  {hasAnswerBody ? (
                    <div className={hasAnswerText ? "mt-[1.15rem]" : undefined}>
                      <PortableText
                        value={item.answer!}
                        components={answerComponents}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

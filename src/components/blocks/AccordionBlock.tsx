import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

import { nestedPortableComponents } from "@/components/portableText/baseComponents";

export type AccordionBlockValue = {
  title?: string;
  body?: PortableTextBlock[];
};

/**
 * アコーディオン（章の折りたたみ）。
 * 見出しは Sonocafe 風のトープ帯。本文は折りたたみ。初期は閉じる。
 */
export function AccordionBlock({ value }: { value?: AccordionBlockValue }) {
  const { title, body } = value ?? {};
  if (!title) return null;

  return (
    <details className="group my-10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[#2c3e6b] px-4 py-3.5 text-[1.05rem] font-bold tracking-[0.08em] text-white transition-colors hover:bg-[#1f2d4f] [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-white/90 transition-transform duration-200 group-[[open]]:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </summary>

      <div className="border border-t-0 border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5 tracking-[0.06em] leading-[1.55] text-[var(--color-ink)]">
        {body && body.length > 0 && (
          <PortableText value={body} components={nestedPortableComponents} />
        )}
      </div>
    </details>
  );
}

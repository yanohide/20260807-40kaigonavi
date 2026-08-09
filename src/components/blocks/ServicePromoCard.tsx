import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { SanityImageSource } from "@sanity/image-url";
import Image from "next/image";

import { nestedPortableComponents } from "@/components/portableText/baseComponents";
import { urlForImage } from "@/sanity/lib/image";

export type ServicePromoCardValue = {
  title?: string;
  icon?: SanityImageSource & { alt?: string; src?: string };
  points?: PortableTextBlock[];
  detailUrl?: string;
  officialUrl?: string;
};

const ACCENT = "var(--color-accent)";

function resolveIconSrc(icon?: ServicePromoCardValue["icon"]): string | null {
  if (!icon) return null;
  const sanitySrc = urlForImage(icon)?.width(240).height(240).url() ?? null;
  const externalSrc =
    typeof icon.src === "string" && /^https?:\/\//i.test(icon.src)
      ? icon.src
      : null;
  return sanitySrc || externalSrc;
}

function PromoButton({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: "red" | "blue";
}) {
  const className =
    tone === "red"
      ? "bg-[#e53935] hover:bg-[#c62828]"
      : "bg-[#1e88e5] hover:bg-[#1565c0]";
  const glow =
    tone === "red"
      ? "0 0 0 1px rgba(229,57,53,0.35), 0 8px 24px rgba(229,57,53,0.4), 0 0 34px rgba(255,80,70,0.55)"
      : "0 0 0 1px rgba(30,136,229,0.3), 0 8px 22px rgba(30,136,229,0.4), 0 0 30px rgba(30,136,229,0.45)";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`service-promo-card-btn inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-base font-bold tracking-[0.08em] text-white no-underline transition-[box-shadow,transform,background-color] duration-300 hover:-translate-y-0.5 cryptoblog-btn-glow ${className}`}
      style={{ boxShadow: glow, color: "#ffffff" }}
    >
      <span className="text-white">{label}</span>
      <svg
        viewBox="0 0 24 24"
        className="ml-2 h-4 w-4 shrink-0 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 5h5v5m0-5L10 14M9 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"
        />
      </svg>
    </a>
  );
}

export function ServicePromoCard({ value }: { value?: ServicePromoCardValue }) {
  const { title, icon, points, detailUrl, officialUrl } = value ?? {};
  if (!title || !detailUrl || !officialUrl) return null;

  const iconSrc = resolveIconSrc(icon);
  const iconAlt =
    (typeof icon === "object" && icon && "alt" in icon && icon.alt) || title;

  return (
    <div
      className="service-promo-card titled-frame relative my-10 border-2 bg-white px-5 py-5 pt-6 not-prose"
      style={{ borderColor: ACCENT }}
    >
      <span className="absolute left-4 top-0 -translate-y-1/2 bg-white px-2.5 text-sm font-bold tracking-[0.06em] text-[#333]">
        {title}
      </span>

      <div className="service-promo-card-main mt-1 flex flex-col items-stretch gap-5 sm:flex-row sm:items-center">
        {iconSrc ? (
          <div className="service-promo-card-icon shrink-0 sm:w-1/3">
            <Image
              src={iconSrc}
              alt={iconAlt || ""}
              width={160}
              height={160}
              className="service-promo-card-icon-img mx-auto block h-auto w-full max-w-[160px] rounded-md object-contain"
            />
          </div>
        ) : null}
        <div className="service-promo-card-points min-w-0 flex-1 tracking-[0.06em] leading-[1.55] text-[var(--color-ink)]">
          {points && points.length > 0 ? (
            <PortableText value={points} components={nestedPortableComponents} />
          ) : null}
        </div>
      </div>

      <div className="service-promo-card-actions mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PromoButton href={detailUrl} label="詳しい内容を見る" tone="red" />
        <PromoButton href={officialUrl} label="公式サイトを見る" tone="blue" />
      </div>
    </div>
  );
}

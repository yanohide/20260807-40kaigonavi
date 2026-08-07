import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME, STATIC_PAGES } from "@/lib/siteStructure";

export const metadata: Metadata = {
  title: STATIC_PAGES.about.title,
};

export default function AboutPage() {
  return (
    <div className="page-shell">
      <h1 className="article-title">{STATIC_PAGES.about.title}</h1>
      <p className="mt-6 tracking-[0.06em] leading-[1.7] text-[var(--color-muted)]">
        {SITE_NAME}{" "}
        の運営者情報プレースホルダです。プロフィール・経歴・運営方針などを後から追記してください。
      </p>
      <Link href="/" className="profile-link mt-8 inline-block">
        ← トップへ
      </Link>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME, STATIC_PAGES } from "@/lib/siteStructure";

export const metadata: Metadata = {
  title: STATIC_PAGES.privacy.title,
};

export default function PrivacyPage() {
  return (
    <div className="page-shell">
      <h1 className="article-title">{STATIC_PAGES.privacy.title}</h1>
      <p className="mt-6 tracking-[0.06em] leading-[1.7] text-[var(--color-muted)]">
        このページはプレースホルダです。{SITE_NAME}{" "}
        のプライバシーポリシー本文は、公開前にここに記載（または Sanity Page
        に移行）してください。
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 tracking-[0.06em] text-[var(--color-muted)]">
        <li>取得する情報の種類</li>
        <li>利用目的</li>
        <li>第三者提供・お問い合わせ窓口</li>
      </ul>
      <Link href="/" className="profile-link mt-8 inline-block">
        ← トップへ
      </Link>
    </div>
  );
}

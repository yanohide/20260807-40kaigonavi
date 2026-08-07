import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME, STATIC_PAGES } from "@/lib/siteStructure";

export const metadata: Metadata = {
  title: STATIC_PAGES.contact.title,
};

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "info@example.com";

export default function ContactPage() {
  return (
    <div className="page-shell">
      <h1 className="article-title">{STATIC_PAGES.contact.title}</h1>
      <p className="mt-6 tracking-[0.06em] leading-[1.7] text-[var(--color-muted)]">
        本格的なフォームはフェーズ7-F で実装します。当面はメールでご連絡ください。
      </p>
      <p className="mt-8">
        <a href={`mailto:${CONTACT_EMAIL}`} className="contact-mailto-btn">
          メールで問い合わせる（{CONTACT_EMAIL}）
        </a>
      </p>
      <p className="mt-4 text-sm tracking-[0.06em] text-[var(--color-muted)]">
        アドレスは環境変数 NEXT_PUBLIC_CONTACT_EMAIL で変更できます（未設定時は
        example.com）。
      </p>
      <Link href="/" className="profile-link mt-8 inline-block">
        ← {SITE_NAME} トップへ
      </Link>
    </div>
  );
}

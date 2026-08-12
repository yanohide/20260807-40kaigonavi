import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/ContactForm";
import { SITE_NAME, STATIC_PAGES } from "@/lib/siteStructure";

export const metadata: Metadata = {
  title: STATIC_PAGES.contact.title,
};

export default function ContactPage() {
  return (
    <div className="page-shell">
      <h1 className="article-title">{STATIC_PAGES.contact.title}</h1>

      <div className="mt-8">
        <ContactForm />
      </div>

      <Link href="/" className="profile-link mt-8 inline-block">
        ← {SITE_NAME} トップへ
      </Link>
    </div>
  );
}

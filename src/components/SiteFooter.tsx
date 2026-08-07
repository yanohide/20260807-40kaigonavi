import Link from "next/link";

import { FOOTER_BAR_LINKS } from "@/lib/footerContent";
import { SITE_NAME } from "@/lib/siteStructure";

/** sonocafe.xyz と同じ：茶色フッターバー＋リンクのみ */
export function SiteFooter() {
  return (
    <footer className="site-footer site-footer--wp">
      <div className="site-footer-bar">
        <nav className="site-footer-bar-nav" aria-label="フッター">
          {FOOTER_BAR_LINKS.map((item, index) => (
            <span key={item.href} className="site-footer-bar-item">
              {index > 0 ? (
                <span className="site-footer-bar-sep" aria-hidden="true">
                  |
                </span>
              ) : null}
              <Link href={item.href}>{item.label}</Link>
            </span>
          ))}
        </nav>
        <p className="site-footer-copy">
          <span lang="en">&copy;</span> Copyright 2022–{new Date().getFullYear()}{" "}
          {SITE_NAME} All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

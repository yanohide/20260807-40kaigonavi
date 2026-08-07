import Link from "next/link";

import { GLOBAL_NAV } from "@/lib/siteStructure";

type SiteNavProps = {
  className?: string;
};

export function SiteNav({ className = "site-nav" }: SiteNavProps) {
  return (
    <nav className={className} aria-label="グローバルメニュー">
      {GLOBAL_NAV.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

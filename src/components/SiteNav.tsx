import Link from "next/link";

import { GLOBAL_NAV } from "@/lib/siteStructure";

type SiteNavProps = {
  className?: string;
  id?: string;
  onNavigate?: () => void;
};

export function SiteNav({ className = "site-nav", id, onNavigate }: SiteNavProps) {
  return (
    <nav id={id} className={className} aria-label="グローバルメニュー">
      {GLOBAL_NAV.map((item) => (
        <Link key={item.href} href={item.href} onClick={onNavigate}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

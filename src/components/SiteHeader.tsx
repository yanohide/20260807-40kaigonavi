"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteNav } from "@/components/SiteNav";
import { SiteLogo } from "@/components/SiteLogo";
import { SITE_NAME } from "@/lib/siteStructure";

export function SiteHeader() {
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      setStuck(window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const headerClassName = [
    "site-header",
    stuck && "site-header--stuck",
    menuOpen && "site-header--menu-open",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClassName}>
      <div className="site-header-inner">
        <div className="site-header-brand">
          <SiteLogo
            priority
            sizes="(max-width: 640px) 70vw, 220px"
          />
          <Link href="/" className="site-header-text-brand">
            {SITE_NAME}
          </Link>
        </div>
        <button
          type="button"
          className="site-header-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav-mobile"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="site-header-toggle-bar" />
          <span className="site-header-toggle-bar" />
          <span className="site-header-toggle-bar" />
        </button>
        <SiteNav
          id="site-nav-mobile"
          className={menuOpen ? "site-nav site-nav--open" : "site-nav"}
          onNavigate={() => setMenuOpen(false)}
        />
      </div>
    </header>
  );
}

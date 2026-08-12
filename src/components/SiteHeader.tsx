"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SiteNav } from "@/components/SiteNav";
import { SiteLogo } from "@/components/SiteLogo";
import { SITE_NAME } from "@/lib/siteStructure";

export function SiteHeader() {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setStuck(window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={stuck ? "site-header site-header--stuck" : "site-header"}
    >
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
        <SiteNav />
      </div>
    </header>
  );
}

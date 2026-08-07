import { SiteNav } from "@/components/SiteNav";
import { SiteLogo } from "@/components/SiteLogo";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="site-header-brand">
          <SiteLogo
            priority
            sizes="(max-width: 640px) 70vw, 220px"
          />
        </div>
        <SiteNav />
      </div>
    </header>
  );
}

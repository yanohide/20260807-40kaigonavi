import Image from "next/image";
import Link from "next/link";

import { HOME_ASSETS } from "@/lib/homeContent";
import { SITE_NAME } from "@/lib/siteStructure";

type SiteLogoProps = {
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
};

export function SiteLogo({
  className = "site-logo",
  imgClassName = "site-logo-img",
  sizes = "(max-width: 640px) 70vw, 220px",
  priority = false,
}: SiteLogoProps) {
  return (
    <Link href="/" className={className}>
      <Image
        src={HOME_ASSETS.logo}
        alt={SITE_NAME}
        width={500}
        height={219}
        priority={priority}
        sizes={sizes}
        className={imgClassName}
      />
    </Link>
  );
}

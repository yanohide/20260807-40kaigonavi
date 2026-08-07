import Image from "next/image";
import Link from "next/link";

import {
  HOME_PICKUP_BANNERS,
  homePickupBannerHref,
} from "@/lib/homeContent";

export function HomePickupBanners() {
  return (
    <section className="home-pickup" aria-label="おすすめ記事">
      <ul className="home-pickup-list">
        {HOME_PICKUP_BANNERS.map((banner) => (
          <li key={banner.key} className="home-pickup-item">
            <Link
              href={homePickupBannerHref(banner.postSlug)}
              className="home-pickup-link"
            >
              <Image
                src={banner.image}
                alt={banner.imageAlt}
                width={1200}
                height={627}
                sizes="(min-width: 960px) 320px, 50vw"
                className="home-pickup-img"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

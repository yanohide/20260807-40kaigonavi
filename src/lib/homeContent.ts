/** WP ホーム再現用の静的アセット（public/images/ 配下） */
import {
  OPERATOR_AVATAR,
  OPERATOR_PROFILE_NAME,
} from "@/lib/operatorProfile";

export const HOME_ASSETS = {
  /** WP メインビジュアル（1600×500） */
  heroImage: "/images/kaigonavi-hero.jpg",
  /** WP ヘッダーロゴ（500×219）— キャッシュ回避のため専用ファイル名 */
  logo: "/images/kaigonavi-logo.png",
  profileImage: OPERATOR_AVATAR,
  pickupBanners: {
    careDepression: "/images/pickup-care-depression.jpg",
    dementia: "/images/pickup-dementia.jpg",
    monitoring: "/images/pickup-monitoring.jpg",
    nursingHome: "/images/pickup-nursinghome.jpg",
  },
} as const;

export type HomePickupBanner = {
  key: string;
  label: string;
  postSlug: string;
  image: string;
  imageAlt: string;
};

export const HOME_PICKUP_BANNERS: HomePickupBanner[] = [
  {
    key: "PICKUP_1",
    label: "介護うつセルフチェック",
    postSlug: "care-depression",
    image: HOME_ASSETS.pickupBanners.careDepression,
    imageAlt: "介護うつとは？セルフチェック",
  },
  {
    key: "PICKUP_2",
    label: "認知症は治療できる？",
    postSlug: "dementia-treatment-method",
    image: HOME_ASSETS.pickupBanners.dementia,
    imageAlt: "認知症の治療と相談先",
  },
  {
    key: "PICKUP_3",
    label: "見守りサービス比較",
    postSlug: "elderly-care-services-comparison",
    image: HOME_ASSETS.pickupBanners.monitoring,
    imageAlt: "高齢者見守りサービス18社比較",
  },
  {
    key: "PICKUP_4",
    label: "老人ホーム費用対策",
    postSlug: "nursinghome-expensive",
    image: HOME_ASSETS.pickupBanners.nursingHome,
    imageAlt: "老人ホームの費用を安くする方法",
  },
];

export function homePickupBannerHref(postSlug: string): `/posts/${string}` {
  return `/posts/${postSlug}`;
}

export const HOME_HERO_CATCH =
  "40代からの介護・老後の不安を、わかりやすく具体的に。";

export const HOME_POPULAR_POST_SLUGS = [
  "care-depression",
  "dementia-treatment-method",
  "non-insurance-nursing-care-services-types-and-cost",
] as const;

export const HOME_RECOMMENDED_POST_SLUGS = [
  "elderly-care-services-comparison",
  "nursinghome-expensive",
  "care-depression",
] as const;

export type HomeSidebarPostRef = {
  _id: string;
  slug: { current: string };
};

export function pickPostsBySlugs<T extends HomeSidebarPostRef>(
  allPosts: T[],
  slugs: readonly string[],
  limit = 3,
): T[] {
  const bySlug = new Map(allPosts.map((post) => [post.slug.current, post]));
  const picked: T[] = [];

  for (const slug of slugs) {
    const post = bySlug.get(slug);
    if (!post || picked.some((item) => item._id === post._id)) continue;
    picked.push(post);
    if (picked.length >= limit) return picked;
  }

  for (const post of allPosts) {
    if (picked.some((item) => item._id === post._id)) continue;
    picked.push(post);
    if (picked.length >= limit) break;
  }

  return picked;
}

export const HOME_OPERATOR_PROFILE = {
  name: OPERATOR_PROFILE_NAME,
  credentials: "PT・ケアマネ・FP2級",
  caption: OPERATOR_PROFILE_NAME,
  textHeading: "【当サイトの運営者】",
  lines: [
    "経歴： 介護分野17年のリハビリ専門家",
    "活動： アラフィフのFPとしても活動中",
    "家族： 2人の子育てパパで、遠くに住む両親の健康状態も気にかける毎日",
    "発信： 介護とお金のダブルライセンスを活かし、40歳からの介護のなやみに役立つ情報をわかりやすく発信中",
    "ミッション： なやみが解決できるよう、やさしくナビゲートします",
  ],
} as const;

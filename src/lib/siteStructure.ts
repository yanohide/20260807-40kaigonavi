/**
 * docs/site-structure.md の正本に合わせたサイト構成。
 * メニュー・ハブ URL・categories フィルタで参照する。
 */

export type HubDef = {
  key: string;
  title: string;
  slug: string;
  category: string;
  intro: string;
};

export const SITE_NAME = "40歳からの介護ナビ";

export const HUB_IMPL = "A" as const;

/** WordPress sonocafe.xyz のカテゴリに対応 */
export const HUBS: HubDef[] = [
  {
    key: "HUB_1",
    title: "介護の悩み",
    slug: "care-worries",
    category: "介護の悩み",
    intro:
      "介護うつ・認知症・保険外サービスなど、家族介護の悩みをわかりやすく解説した記事の入り口です。",
  },
  {
    key: "HUB_2",
    title: "老人ホーム選び",
    slug: "nursing-home",
    category: "老人ホーム選び",
    intro:
      "老人ホーム・介護施設の費用や選び方について、具体的な対策と相談先をまとめています。",
  },
  {
    key: "HUB_3",
    title: "高齢者見守り",
    slug: "elderly-monitoring",
    category: "高齢者見守り",
    intro:
      "見守りサービスや在宅支援の比較・選び方など、高齢者の安全と安心につながる記事を集めています。",
  },
  {
    key: "HUB_4",
    title: "高齢者便利グッズ",
    slug: "elderly-goods",
    category: "高齢者便利グッズ",
    intro:
      "高齢者の暮らしを楽にする便利グッズ・サービスに関する記事の入り口です。",
  },
  {
    key: "HUB_5",
    title: "実家じまい",
    slug: "closing-family-home",
    category: "実家じまい",
    intro:
      "実家の片付け・売却・空き家管理など、実家じまいの進め方をまとめています。",
  },
];

export const STATIC_PAGES = {
  home: {
    title: "ホーム",
    slug: "",
    href: "/",
    note: "トップ。新着記事・pickup バナー",
  },
  privacy: { title: "プライバシーポリシー", slug: "privacy", href: "/privacy" },
  contact: {
    title: "お問合せ",
    slug: "contact",
    href: "/contact",
    note: "mailto: contact@sonocafe.xyz",
  },
  about: { title: "運営者情報", slug: "about", href: "/about" },
} as const;

/** sonocafe.xyz トップメニューと同じ並び（カテゴリのみ） */
export const GLOBAL_NAV = [
  { label: "高齢者見守り", href: "/pages/elderly-monitoring" },
  { label: "高齢者便利グッズ", href: "/pages/elderly-goods" },
  { label: "老人ホーム選び", href: "/pages/nursing-home" },
  { label: "実家じまい", href: "/pages/closing-family-home" },
  { label: "介護の悩み", href: "/pages/care-worries" },
] as const;

export function getHubBySlug(slug: string): HubDef | undefined {
  return HUBS.find((hub) => hub.slug === slug);
}

export function getAllHubSlugs(): string[] {
  return HUBS.map((hub) => hub.slug);
}

/** トップ pickup バナーの Post slug 一覧 */
export const HOME_PICKUP_POST_SLUGS = [
  "care-depression",
  "dementia-treatment-method",
  "elderly-care-services-comparison",
  "nursinghome-expensive",
] as const;

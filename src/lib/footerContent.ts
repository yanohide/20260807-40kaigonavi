/** フッター用の静的テキスト・リンク */

export type FooterLink = {
  label: string;
  href: string;
};

export const FOOTER_RECOMMENDED_LINKS: FooterLink[] = [
  { label: "トップページ", href: "/" },
  { label: "新着記事一覧", href: "/posts" },
  { label: "介護うつセルフチェック", href: "/posts/care-depression" },
  { label: "認知症の治療と相談先", href: "/posts/dementia-treatment-method" },
  {
    label: "介護保険外サービス",
    href: "/posts/non-insurance-nursing-care-services-types-and-cost",
  },
  { label: "見守りサービス比較", href: "/posts/elderly-care-services-comparison" },
  { label: "老人ホーム費用対策", href: "/posts/nursinghome-expensive" },
];

export const FOOTER_DISCLAIMER = {
  noticeTitle: "ご留意事項",
  noticeBody:
    "当サイトの内容は、執筆時点の情報に基づく一般的な解説です。個別の医療・介護の判断は、主治医やケアマネジャー等の専門家にご相談ください。",
  alertTitle: "医療・介護に関する注意",
  officialLinks: [
    {
      label: "厚生労働省：介護保険制度",
      href: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kaigo_osirase/",
    },
    {
      label: "介護サービス情報公表システム",
      href: "https://kaigohiraku.mhlw.go.jp/",
    },
    {
      label: "地域包括支援センター（厚労省）",
      href: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/shakai/include/seikatsushien_center.html",
    },
  ] as FooterLink[],
};

export const FOOTER_RISK_NOTES = [
  "介護・医療の制度やサービス内容は改定されることがあります。最新情報は公的機関の発表もあわせてご確認ください。",
  "当サイトに掲載するアフィリエイトリンクから商品・サービスを申し込んだ場合、当サイトに報酬が発生することがあります。",
];

export const FOOTER_MEDIA = {
  title: "メディア・掲載について",
  body: "取材・引用・リンクについてのお問い合わせは、お問合せフォームよりご連絡ください。",
  link: { label: "お問合せはこちら", href: "/contact" },
};

export const FOOTER_BAR_LINKS: FooterLink[] = [
  { label: "ホーム", href: "/" },
  { label: "プロフィール", href: "/about" },
  { label: "プライバシーポリシー", href: "/privacy" },
  { label: "お問合せ", href: "/contact" },
];

SITE_NAME = 仮想通貨マニア
HUB_IMPL = A

# グローバルメニュー順：ホーム → ハブ → お問合せ
# ホーム = トップ（/）。今後は新着記事などカスタム予定
# お問合せ = /contact。本格メールフォームはフェーズ7-F

PAGE_HOME = ホーム                 slug: （トップ /）
HUB_1 = 仮想通貨    slug: crypto       category: 仮想通貨
HUB_2 = NFT         slug: nft          category: NFT
HUB_3 = メタバース  slug: metaverse    category: メタバース
HUB_4 = DeFi        slug: defi         category: DeFi
PAGE_CONTACT = お問合せ               slug: contact

PAGE_PRIVACY = プライバシーポリシー   slug: privacy
PAGE_ABOUT   = 運営者情報             slug: about

# トップ（/）ヒーロー直下 pickup バナー 4枚
# 実装: src/lib/homeContent.ts → HOME_PICKUP_BANNERS
# 画像: public/images/pickup-1.png 〜 pickup-4.png（旧 WP より取得）
# レイアウト: ヒーロー直下・4列（PC）/ 2列（SP）。各カード → /posts/[slug]

PICKUP_1 = 仮想通貨の始め方   post: how-to-start-cryptocurrency-investment   image: pickup-1.png
PICKUP_2 = NFTの始め方        post: opensea-how-to-purchase-nft              image: pickup-2.png
PICKUP_3 = DeFiの稼ぎ方       post: pancakeswap-how-to-start                 image: pickup-3.png
PICKUP_4 = おすすめ取引所     post: coincheck-register                       image: pickup-4.png

# sonocafe.xyz 旧 URL → 新 URL（301）

NS 切替後、`sonocafe.xyz` は Cloudflare Worker（Next.js）を向くため、**Xserver の `.htaccess` では旧 URL に来た人を転送できない**。  
301 は `src/lib/legacyRedirects.ts` と `src/middleware.ts` で処理する（OpenNext on Cloudflare では middleware が確実）。

## 本番 workers.dev → sonocafe.xyz

`20260807-40kaigonavi.sonozono.workers.dev` へのアクセスは **301 で `sonocafe.xyz` に統一**する。  
Preview（`*-20260807-40kaigonavi.sonozono.workers.dev`）はリダイレクトしない。

実装: `cloudflare/worker-entry.mjs`（トップ `/` は静的キャッシュで middleware を通らないため Worker 入口で判定）。

## 記事（5本）

| 旧 URL | 新 URL |
|---|---|
| `/care-depression/` | `/posts/care-depression` |
| `/dementia-treatment-method/` | `/posts/dementia-treatment-method` |
| `/elderly-care-services-comparison/` | `/posts/elderly-care-services-comparison` |
| `/non-insurance-nursing-care-services-types-and-cost/` | `/posts/non-insurance-nursing-care-services-types-and-cost` |
| `/nursinghome-expensive/` | `/posts/nursinghome-expensive` |

## カテゴリ → ハブ

| 旧 URL（WP category） | 新 URL |
|---|---|
| `/category/介護のお悩み/` | `/pages/care-worries` |
| `/category/介護の悩み/` | `/pages/care-worries` |
| `/category/高齢者見守り/` | `/pages/elderly-monitoring` |
| `/category/高齢者便利グッズ/` | `/pages/elderly-goods` |
| `/category/老人ホーム選び/` | `/pages/nursing-home` |
| `/category/実家じまい/` | `/pages/closing-family-home` |

## 旧固定ページ（日本語 slug）

| 旧 URL | 新 URL |
|---|---|
| `/高齢者見守り/` | `/pages/elderly-monitoring` |
| `/老人ホーム探し/` | `/pages/nursing-home` |
| `/実家じまい/` | `/pages/closing-family-home` |
| `/介護の便利グッズ/` | `/pages/elderly-goods` |
| `/プロフィール/` | `/about` |
| `/新プライバシーポリシー/` | `/privacy` |
| `/お問合せ/` | `/contact` |
| `/介護とお金/` | `/` |

## 反映方法

```bash
git add src/lib/legacyRedirects.ts src/middleware.ts next.config.ts docs/sonocafe-legacy-redirects.md
git commit -m "..."
git push
# Cloudflare Builds が自動デプロイ、または Dashboard で Retry deployment
```

## 確認（デプロイ後）

```bash
curl -I https://sonocafe.xyz/care-depression/
# → HTTP/2 308 または 301
# → location: /posts/care-depression
```

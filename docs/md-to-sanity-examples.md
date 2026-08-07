# ビフォー／アフター実例（パイロット1本）

パイロット記事（cryptoblog）:

- MD: `articles/crypto-assets-investment-withdrawal-of-capital.md`
- slug: `crypto-assets-investment-withdrawal-of-capital`
- Sanity `_id`: `887cefa1-8ccb-4a2b-9c82-1bead0eb8c90`
- project / dataset: `anvg4mk1` / `production`
- ローカル表示: `http://localhost:3000/posts/crypto-assets-investment-withdrawal-of-capital`
- Studio: `http://localhost:3333/studio`（`basePath: "/studio"`）

入稿コマンド:

```bash
cd /Users/sono/code/website/20260706_cryptoblog
npm run upload:sanity-publish -- articles/crypto-assets-investment-withdrawal-of-capital.md --publish
```

入稿後の型カウント（実測）:

| `_type` | 件数 |
|---|---|
| speechBubble | 27 |
| titledFrame | 30 |
| table | 2 |
| qaBlock | 1（items 4） |
| customButton | 6 |
| relatedArticleCard | 5 |
| h2 | 6（FAQ 見出し「質問と回答」を含む） |

---

## 1. 吹き出し → `speechBubble`

### ビフォー（MD）

```md
:::speech
speaker: 質問者
side: left
tone: sky

仮想通貨投資の「原資抜き」が知りたいです
そもそも「原資抜き」って何？
:::
```

連続する質問者吹き出しは、読者体験のために **1〜2 本にまとめてよい**（パイロットではオープニングを 2 本に統合）。

### アフター（Sanity JSON）

```json
{
  "_type": "speechBubble",
  "speaker": "質問者",
  "position": "left",
  "text": "仮想通貨投資の「原資抜き」が知りたいです\nそもそも「原資抜き」って何？"
}
```

メモ:

- MD の `side: left|right` → JSON の `position`
- 複数行本文は `\n` で保持

---

## 2. 囲み → `titledFrame`

### ビフォー A（タイトル＋リスト／目次）

```md
**本記事の内容**

-   仮想通貨の「原資抜き」のやり方
-   仮想通貨の税金について①【基本】
-   仮想通貨の税金について②【計算】
-   仮想通貨が課税対象になるタイミング【４つ】
-   質問と回答【４つ】
-   まとめ
```

### アフター A

```json
{
  "_type": "titledFrame",
  "title": "本記事の内容",
  "style": "band",
  "body": [
    {
      "_type": "block",
      "listItem": "bullet",
      "style": "normal",
      "children": [{ "_type": "span", "text": "仮想通貨の「原資抜き」のやり方", "marks": [] }]
    }
  ]
}
```

フロント側メモ（目次リンク）:

- H2/H3 に `id`（`src/lib/headingId.ts`）
- 目次リストは `listItem.bullet` で `href="#…"` を付与（`block.normal` だけでは listItem 経路に乗らない）

### ビフォー B（運営者情報＋アバター）

```md
:::titled-box
title: サイト運営者の情報
style: band
avatar: yanohide
avatarCaption: ひよこ忍者

- 本業： 介護施設の職員（歴18年）
- 副業： AIを活用したブログ運営＆仮想通貨投資で資産運用
- 資格： 2級FP技能士×ケアマネ
- ミッション： 学びながら稼ぐ！「AI×仮想通貨」で老後やインフレに備える資産防衛術をお届けします。
- 一言： 読書好きのアラフィフ2児のパパです。
:::
```

### アフター B

```json
{
  "_type": "titledFrame",
  "title": "サイト運営者の情報",
  "style": "band",
  "avatarCaption": "ひよこ忍者",
  "avatar": { "_type": "image", "asset": { "_ref": "…" } },
  "body": [
    {
      "_type": "block",
      "listItem": "bullet",
      "children": [
        {
          "_type": "span",
          "text": "本業： 介護施設の職員（歴18年）"
        }
      ]
    }
  ]
}
```

フロント側メモ:

- 丸アバター: `.frame-avatar`（`.prose-blog img` の四角上書きを打ち消す）
- 名前は枠タイトルではなく `avatarCaption`（アイコン直下）
- 箇条書きは密な行間（`leading-snug` / `my-0.5`）

---

## 3. 表 → `table`

### ビフォー（MD）

```md
| 所得金額（複数所得の合算） | 所得税率（国税） | 住民税率（地方税） | 合計 |
| --- | --- | --- | --- |
| 194.9万円以下 | 5% | 10% | 15% |
| 329.9万円以下 | 10% | 10% | 20% |
```

### アフター（Sanity JSON・要約）

```json
{
  "_type": "table",
  "rows": [
    {
      "_type": "tableRow",
      "cells": [
        "所得金額（複数所得の合算）",
        "所得税率（国税）",
        "住民税率（地方税）",
        "合計"
      ]
    },
    {
      "_type": "tableRow",
      "cells": ["194.9万円以下", "5%", "10%", "15%"]
    }
  ]
}
```

実測: 税率表は `rows` 8 行（ヘッダ含む）。

---

## 4. Q&A → `qaBlock`

### ビフォー（MD）

```md
## 質問と回答

### **少ない利益なら無申告でもバレない！？**

結論、バレます。

「仮想通貨は匿名性が高いから自分は大丈夫」と安心してはいけません。…
```

### アフター（Sanity JSON・要約）

```json
{
  "_type": "qaBlock",
  "items": [
    {
      "question": "少ない利益なら無申告でもバレない！？",
      "answer": [
        {
          "_type": "block",
          "style": "normal",
          "children": [{ "_type": "span", "text": "結論、バレます。", "marks": [] }]
        }
      ]
    }
  ]
}
```

メモ:

- FAQ の H2（`## 質問と回答` / `## よくある質問`）は **落とさず** `block` style `h2` として残す（目次・アンカー用）
- 配下の `###` が `qaBlock.items[]` になる
- A バッジと本文1行目の縦位置は `qaAnswerComponents`（先頭ブロック `!m-0`）で揃える
- 回答内の `relatedArticleCard` / `titledFrame` 等は `nestedPortableComponents` 経由で描画（再帰 `qaBlock` は除外）

---

## 5. Aff CTA → `customButton`（追加確認）

### ビフォー（MD）

```md
**＼ 平均10秒で自動損益計算／**

[クリプタクトを無料で試す](https://px.a8.net/svt/ejp?a8mat=…)
```

### アフター

```json
{
  "_type": "customButton",
  "text": "クリプタクトを無料で試す",
  "url": "https://px.a8.net/svt/ejp?a8mat=3TJ5MG+C9681E+4DGW+61Z82",
  "color": "red",
  "glow": true,
  "eyebrow": "平均10秒で自動損益計算"
}
```

---

## 6. 関連記事 → `relatedArticleCard`（追加確認）

### ビフォー（MD）

```md
あわせて読みたい

[![…](https://…/image.jpg)](https://…/image.jpg)

[【初心者】仮想通貨投資の始め方を５ステップ解説【100円単位】](https://snooks.xsrv.jp/how-to-start-cryptocurrency-investment/)
```

### アフター

```json
{
  "_type": "relatedArticleCard",
  "label": "あわせて読みたい",
  "title": "【初心者】仮想通貨投資の始め方を５ステップ解説【100円単位】",
  "url": "https://snooks.xsrv.jp/how-to-start-cryptocurrency-investment/",
  "image": { "_type": "image", "asset": { "_ref": "…" } }
}
```

表示メモ（SWELL 寄せ）:

- 枠線上ラベル「✅ あわせて読みたい」
- 横並びサムネ＋タイトル（`<p>`・上揃え）
- 抜粋・説明文は出さない

---

## 7. ヒーロー画像（frontmatter → post.heroImage）

### ビフォー（MD frontmatter）

```yaml
heroImage: https://snooks.xsrv.jp/wp-content/uploads/….jpg
```

### アフター

- post ドキュメントの `heroImage` フィールドにアップロードされた image
- 記事ページは H1 直下に表示（`posts/[slug]/page.tsx`）

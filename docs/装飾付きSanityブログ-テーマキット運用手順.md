# 装飾付き Sanity ブログ — テーマキット運用手順（超具体）

対象読者: Cursor / Sanity / Next.js をこれから使い回したい初心者  
目的: 「WordPress のテーマのように」装飾つきブログを使い回し、新サイトでは色など見た目だけ変える

---

## 0. 言葉の意味（ここがわからないと全部霧がかかる）

### 「正本」とは？

**いちばん正しい・完成したひな形のプロジェクトフォルダ**のことです。

この運用では、今できあがっているサイト:

`/Users/sono/code/website/20260706_cryptoblog`

を **正本** と呼びます。

| たとえ | 意味 |
|--------|------|
| WordPress | 「完成テーマが入ったサンプルサイト」そのもの |
| 料理 | 「味が決まったレシピ本」 |
| 書類 | 「原本」。コピーは原本から作る |

**正本を直す = 今後の新サイトの土台が良くなる**  
**新サイトだけ直す = そのサイトだけの着せ替え**

「正本」＝「キットの中身が入っている完成プロジェクト」だと思ってください。

### 「キット」とは？

正本の中にある、次のセットのことです。

- Sanity スキーマ（吹き出し・表・Q&A・キャプション枠など）
- Studio の入力まわり
- 公開側の表示コンポーネント
- 見た目の土台 CSS（理想は「色は変数だけ」）

### 「テーマ差し替え」とは？

新サイトで主に変えるもの:

- 色（CSS 変数）
- サイト名
- Sanity のプロジェクト ID（別サイト用の倉庫）
- Cloudflare の Worker 名など

変えないもの（キット本体）:

- 装飾ブロックの型名（`titledFrame` など）
- 表・Q&A の仕組みそのもの

---

## 1. Rule と Skill にできるか？

**できます。両方できます。役割が違います。**

| 種類 | 何のためのもの？ | いつ効く？ | 向いている内容 |
|------|------------------|------------|----------------|
| **Rule（ルール）** | AI への「常時の約束・禁止・方針」 | そのワークスペースでチャットするたびに参照されやすい | 「新サイトは正本から作る」「`.env.local` を流用しない」など短く守らせたいこと |
| **Skill（スキル）** | AI への「長い手順書・実行プレイブック」 | あなたがスキル対象の依頼をしたとき（またはスキル説明に合う依頼のとき）に読む | 「新フォルダ作成 → 正本コピー → 色差し替え」の長い手順 |

### この用途での使い分け（推奨）

1. **Skill** … 「新サイトを正本から作る」手順の本体（このファイルの内容をほぼそのまま Skill にする）
2. **Rule** … 短い守り（正本パス、env 流用禁止、色は変数で、など 5〜10 行）

> 初心者向けまとめ  
> - **Skill** = 料理のレシピ本（長い）  
> - **Rule** = キッチンの貼り紙「生ものは冷蔵庫へ」（短い・いつも見える）

---

## 2. Skill / Rule の置き場所と「どう使うか」

### Skill の典型的な置き場所（Cursor）

例:

- `/Users/sono/.cursor/skills-cursor/` 配下（Cursor 用）
- または `/Users/sono/.agents/skills/` や `/Users/sono/.claude/skills/`（環境によって異なる）

中身はだいたい:

```text
my-skill-folder/
  SKILL.md    ← 手順の本体（これが本体）
```

`SKILL.md` の先頭に `name` と `description` を書くと、Agent が「こういう依頼のときにこの Skill を使う」と判断しやすくなります。

**使い方（あなたがやること）:**

1. Cursor で **新サイト用フォルダ** を開く  
2. チャットを **Agent モード** にする  
3. 例えばこう言う:

```text
装飾付き Sanity ブログのテーマキットで新規サイトを作って。
サイト名は「〇〇ブログ」。メインカラーは #2f6f4e。
```

4. Agent が Skill を読んで、正本コピー〜色差し替えまで進める

※ Skill は「自動で全部やってくれる魔法」ではなく、**Agent に正しい手順を読ませる説明書**です。あなたは「依頼文を投げる人」です。

### Rule の典型的な置き場所（Cursor）

例:

- プロジェクト内: `.cursor/rules/` や `AGENTS.md`
- またはユーザー全体のルール設定

**使い方:**

- 特に何も言わなくても、短い方針が Agent の前提になることが多い  
- 例: 「このシリーズのサイトは必ず正本 `20260706_cryptoblog` から作る」

**あなたが覚える操作は1つだけでもよいです:**

> 新サイトを作りたいときは、空フォルダを開いて Agent に一言頼む。

---

## 3. いまの状態での正直な前提

いまの正本は「装飾つきブログ一式テンプレ」として使える一方、

- 見出し色 `#2c3e6b` などが **一部直書き**
- そのため「色変数だけ変えれば完全にテーマ切り替え」は **まだ完璧ではない**

理想形にする追加作業（後で Agent に頼む文）:

```text
正本 20260706_cryptoblog の見出し・表・帯などの #2c3e6b を
--color-heading などの CSS 変数に統一して。
新サイトは globals.css の変数だけ変えれば配色が変わるようにして。
そのうえで「新規サイト作成」Skill も更新して。
```

この手順書は、**現状でもコピー運用できる手順**＋**理想の Skill/Rule 化**の両方を書きます。

---

## 4. いちばん解像度の高い「毎回の手順」（あなたが手でやる画面操作）

### 事前に1回だけ決めること

- 正本パス: `/Users/sono/code/website/20260706_cryptoblog`
- 新サイトの置き場例: `/Users/sono/code/website/YYYYMMDD_サイト名`

---

### 手順 1 — Cursor を開く

1. Mac の Dock または Spotlight から **Cursor** を起動する

---

### 手順 2 — 新しい空フォルダを作って、Cursor で開く

1. Finder を開く  
2. `/Users/sono/code/website/` に移動  
3. 新しいフォルダを作る（例: `20260801_careblog`）  
4. Cursor メニュー: **File → Open Folder…**  
5. いま作った空フォルダを選んで Open  

確認:

- Cursor 左のファイル一覧が、ほぼ空（または何もない）

---

### 手順 3 — チャットを Agent モードにする

1. Cursor の右（または下）の **Chat** を開く  
2. モードが **Ask** なら **Agent** に切り替える  
   - Ask = 説明だけ  
   - Agent = ファイル作成・コピー・コマンド実行ができる  

ここで「キットを入れる」本番が始まります。

---

### 手順 4 — チャット欄に、次をそのまま貼って送信する

下の文の `( )` だけ自分用に書き換えて送る。

```text
【依頼】装飾付き Sanity ブログを、正本からこのフォルダに新規作成してください。

【正本】
/Users/sono/code/website/20260706_cryptoblog

【作業先】
今 Cursor で開いているフォルダ（このワークスペース）

【やること】
1. 正本を作業先へコピーする
   - 除外: node_modules, .next, .open-next, .env.local, .git（必要なら新規 git init）
2. package.json の name をこのフォルダ名に合わせる
3. wrangler.jsonc の Worker 名もフォルダ名ベースに合わせる（正本と同じ名前にしない）
4. .env.local はコピーしない。代わりに .env.example から .env.local を新規作成し、中身はプレースホルダのまま or 空欄でよい（後で私が入れる）
5. サイト表示名「Crypto Blog」を「（ここに新しいサイト名）」に置換する
6. npm install を実行する
7. 装飾（吹き出し・表・Q&A・キャプション付き枠・アコーディオン・ボタン）は正本と同じ構造を維持する

【テーマ色（任意・あれば）】
メイン／見出し色: （例 #2f6f4e）
リンク色: （例 #2f6f4e）
吹き出し色: （例 #d8eee0）

色指定がある場合は src/app/globals.css の CSS 変数を中心に反映し、
#2c3e6b の直書きがあれば可能な範囲で合わせて変更する。

終わったら、次に私がやること（.env.local の書き方と起動コマンド）を短く書いて。
```

ポイント:

- 「正本」という言葉をチャットに書いてよい（AI にパスを渡す）
- **今開いているフォルダが作業先**であること

---

### 手順 5 — Agent の作業を待つ／許可する

Agent が次のようなことをします。

- ファイルを大量に作成・コピー  
- `npm install` を走らせる（許可ダイアログが出たら許可）

終わるまで待つ。エラーが出たら、そのエラー文をそのままチャットに貼って「直して」でよい。

---

### 手順 6 — Sanity を「このサイト専用」に用意する（ブラウザ作業）

別サイトなので、倉庫も分ける。

1. ブラウザで [https://www.sanity.io/manage](https://www.sanity.io/manage) を開く  
2. **Create new project**  
3. dataset 名は `production` でよい  
4. API Token を発行（記事を書く／アップロードするなら書き込み可能なもの）  
5. Project ID をメモする  

---

### 手順 7 — `.env.local` を自分で書く（Cursor 内）

1. 左のファイル一覧で `.env.example` を開く  
2. 同じ場所に `.env.local` が無ければ作る  
   - 無ければ Agent に「`.env.example` から `.env.local` を作って」でも可  
3. 次を自分の値で埋める  

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=ここに新プロジェクトのID
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=ここにトークン
SANITY_PREVIEW_SECRET=任意の長い合言葉
SANITY_STUDIO_PREVIEW_SECRET=上と同じ合言葉
SANITY_STUDIO_PREVIEW_URL=http://localhost:3000
```

**禁止:** 正本の `.env.local` をそのままコピーして使い続けること  
（別サイトなのに、正本の記事倉庫を見てしまいます）

---

### 手順 8 — 色・名前の最終確認（テーマ差し替え）

1. Cursor で `src/app/globals.css` を開く  
2. ファイル先頭付近の `@theme { ... }` にある `--color-...` を見る  
3. ブランドに合わせて数字（色コード）だけ変える  

よく変えるもの:

- `--color-ink` … 本文の文字色  
- `--color-link` … リンク色  
- `--color-bubble` … 吹き出し背景  
- `--color-line` … 線の色  
- `--color-surface` … うすい背景  

4. `src/app/layout.tsx` を開き、ヘッダーのサイト名が新しい名前になっているか確認  

---

### 手順 9 — 起動して目で確認する

Cursor のターミナル（**Terminal → New Terminal**）を2つ使うのがわかりやすい。

**ターミナル1（サイト）:**

```bash
npm run dev
```

**ターミナル2（Studio 軽量版）:**

```bash
npm run studio
```

ブラウザ:

- サイト: http://localhost:3000  
- Studio: http://localhost:3333  

確認チェック:

- [ ] トップが開く  
- [ ] Studio でログイン／プロジェクトが見える  
- [ ] 記事を新規作成できる  
- [ ] 吹き出し・表・Q&A・キャプション枠が挿入できる  
- [ ] 公開側（またはプレビュー）で装飾の見た目が出る  
- [ ] 色がだいたい意図どおり  

---

### 手順 10 — （任意）サンプル記事投入

```bash
npm run upload:sanity-publish -- articles/sample-post.md
```

トークンやスクリプトが正しいときだけ成功します。失敗したら表示を Agent に貼る。

---

## 5. 「手作業コピー」版（Agent を使いたくないとき）

手順 1〜2 のあと、ターミナルで:

```bash
# 例: 新フォルダ名が 20260801_careblog の場合
rsync -a \
  --exclude node_modules \
  --exclude .next \
  --exclude .open-next \
  --exclude .env.local \
  --exclude .git \
  /Users/sono/code/website/20260706_cryptoblog/ \
  /Users/sono/code/website/20260801_careblog/

cd /Users/sono/code/website/20260801_careblog
npm install
```

その後は **手順 6 以降**（Sanity / `.env.local` / 色 / 起動）と同じ。

---

## 6. Rule 用の短文サンプル（貼る用）

Cursor の Project Rule / AGENTS.md 向け。長い説明は Skill に任せ、Rule は短く。

```text
# 装飾付き Sanity ブログシリーズ

- 正本（キットの原本）: /Users/sono/code/website/20260706_cryptoblog
- 新規サイトはこの正本から複製して作る。ゼロからスキーマを作り直さない
- 正本の .env.local を新サイトへ流用しない（Sanity プロジェクトはサイトごとに分ける）
- 見た目の差分は原則 CSS 変数（globals.css）とサイト名に閉じる
- 装飾ブロック型名（speechBubble, titledFrame, qaBlock, table 等）はむやみに改名しない
- 開発時の執筆 Studio は npm run studio（:3333）を優先。埋め込み /studio は重い
```

**使い方:**  
この短い文を Rule として保存しておく → 以後そのリポ／シリーズで Agent が方針を守りやすくなる。

---

## 7. Skill 用の骨格サンプル（SKILL.md のイメージ）

実際に Skill 化するときは、だいたい次の形です。

```markdown
---
name: decorated-sanity-blog-theme-kit-jp
description: 正本 20260706_cryptoblog から装飾付き Sanity ブログを新規フォルダへ複製し、サイト名・色変数・env・wrangler 名を差し替える。ユーザーが「装飾付きブログ新規」「テーマキットでサイト作成」「正本からコピー」と言ったときに使う。
---

# 装飾付き Sanity ブログ（テーマキット）新規作成

## 正本
/Users/sono/code/website/20260706_cryptoblog

## 手順
1. 作業フォルダ（カレント workspace）を確認
2. 正本をコピー（node_modules/.next/.open-next/.env.local/.git 除外）
3. package.json name / wrangler name をフォルダ名に合わせる
4. サイト名置換
5. globals.css の色変数をユーザー指定色へ
6. .env.example から .env.local を用意（秘密はユーザー記入）
7. npm install
8. ユーザー向けに起動手順を返す
```

**使い方（あなた）:**

1. 空の新フォルダを Cursor で開く  
2. Agent モードのチャットで:

```text
テーマキットで新規サイトを作って。サイト名は〇〇。メイン色は #xxxxxx
```

3. Skill の description に反応して Agent がこの手順を実行する  

すでに `nextjs-sanity-blog-scaffold-jp` がある場合は、

- **統合する**（正本コピー方式に更新する）  
- または **別名の第2スキル** として「装飾完成版」を追加する  

どちらでもよいです。初心者は「名前が1つ」の方が迷いません。

---

## 8. 日常の使い分けフローチャート

```text
新しいサイトを作りたい
  → Cursor で空フォルダを開く
  → Agent モード
  → 「テーマキットで新規作成…」と頼む
  → .env.local を自分の Sanity 用に書く
  → npm run dev / npm run studio
  → 色が微妙なら globals.css だけ触る

キット自体を良くしたい（表の挙動など全サイト共通）
  → 正本フォルダ 20260706_cryptoblog を開く
  → そこで直す
  → 必要なら他サイトへ同じ修正を取り込む

このサイトだけの色・名前
  → そのサイトの globals.css / layout.tsx だけ
```

---

## 9. チェックリスト（印刷用）

### 新サイト作成時

- [ ] Cursor で **新しい空フォルダ** を Open Folder した  
- [ ] チャットが **Agent** モード  
- [ ] 正本パス付きの依頼文を送った  
- [ ] `.env.local` に **新しい** Sanity ID / token を入れた  
- [ ] 正本の `.env.local` は使っていない  
- [ ] `globals.css` で色を見た  
- [ ] `npm run dev` で 3000 が開く  
- [ ] `npm run studio` で 3333 が開く  
- [ ] 装飾ブロックが Studio に出る  

### Skill / Rule 化したいとき

- [ ] この手順を `SKILL.md` にした（長い手順）  
- [ ] 短い約束だけ Rule / AGENTS.md にした  
- [ ] description に「新規サイト」「テーマキット」「正本から」などの呼び方を書いた  
- [ ] 一度、空フォルダで「テーマキットで作って」と試した  

---

## 10. よくあるつまずき

| 症状 | 原因になりやすいこと | 対処 |
|------|----------------------|------|
| 新サイトなのに正本の記事が出る | `.env.local` を正本からコピーした | 新しい Project ID に差し替え |
| Studio が重い／network error | `localhost:3000/studio` を開いている | `npm run studio` の :3333 を使う |
| 装飾が入力できない | スキーマや plugin コピー漏れ | 正本から再コピー／Agent に「正本と差分確認」 |
| 色が一部だけ変わらない | `#2c3e6b` の直書きが残っている | 変数化を正本で進める／直書きも変更 |
| Ask モードで「作って」と言っても何も起きない | Ask は編集しない | **Agent モード**に切り替える |

---

## 11. あなたが覚える最短ルート（3手順だけ）

1. **空フォルダを Cursor で開く**  
2. **Agent モードのチャットに「正本からテーマキットで新規作成」依頼を貼る**  
3. **`.env.local` を新 Sanity 用に書いて `npm run dev` と `npm run studio`**

色を変えたいときは `src/app/globals.css` を開く。

これだけ覚えておけば、運用の骨格は維持できます。

---

## 12. 次に Agent に頼むとよい依頼文（Skill / Rule 化）

```text
この docs/装飾付きSanityブログ-テーマキット運用手順.md を正とし、
・短い Rule（.cursor/rules/ または AGENTS.md）
・実行用 Skill（decorated-sanity-blog-theme-kit-jp または既存 scaffold の更新）
を作って。
正本パスは /Users/sono/code/website/20260706_cryptoblog。
```

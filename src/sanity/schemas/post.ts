import { defineField, defineType } from "sanity";
import { createEmptyPortableTextBlock } from "../lib/emptyPortableTextBlock";

export default defineType({
  name: "post",
  title: "記事",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "スラッグ",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "公開日時",
      type: "datetime",
    }),
    defineField({
      name: "excerpt",
      title: "抜粋",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "categories",
      title: "カテゴリ（ハブ紐付け）",
      description:
        "docs/site-structure.md の category と一字一句同じ文字列を入れてください（例：介護の悩み）。",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
        list: [
          { title: "介護の悩み", value: "介護の悩み" },
          { title: "老人ホーム選び", value: "老人ホーム選び" },
          { title: "高齢者見守り", value: "高齢者見守り" },
          { title: "高齢者便利グッズ", value: "高齢者便利グッズ" },
          { title: "実家じまい", value: "実家じまい" },
        ],
      },
    }),
    defineField({
      name: "heroImage",
      title: "アイキャッチ画像",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", type: "string", title: "代替テキスト" }),
      ],
    }),
    defineField({
      name: "body",
      title: "本文（ブロックエディタ）",
      type: "array",
      initialValue: () => [createEmptyPortableTextBlock()],
      options: {
        insertMenu: {
          groups: [
            { name: "basic", title: "テキスト", of: ["block"] },
            { name: "media", title: "メディア", of: ["image"] },
            { name: "table", title: "表", of: ["table"] },
            {
              name: "decoration",
              title: "装飾ブロック",
              of: [
                "speechBubble",
                "titledFrame",
                "customButton",
                "accordionBlock",
                "qaBlock",
                "relatedArticleCard",
                "appReachCard",
                "servicePromoCard",
              ],
            },
          ],
        },
      },
      of: [
        {
          type: "block",
          styles: [
            { title: "本文", value: "normal" },
            { title: "見出し2", value: "h2" },
            { title: "見出し3", value: "h3" },
            { title: "見出し4", value: "h4" },
            { title: "引用", value: "blockquote" },
          ],
          lists: [
            { title: "箇条書き", value: "bullet" },
            { title: "番号付き", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "太字", value: "strong" },
              { title: "斜体", value: "em" },
              { title: "コード", value: "code" },
              { title: "黄色マーカー", value: "highlight" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "リンク",
                fields: [
                  defineField({
                    name: "href",
                    title: "URL",
                    type: "url",
                    validation: (Rule) =>
                      Rule.uri({
                        scheme: ["http", "https", "mailto"],
                        allowRelative: true,
                      }),
                  }),
                ],
              },
            ],
          },
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", type: "string", title: "代替テキスト" }),
          ],
        },
        {
          type: "table",
          title: "表",
          // Sanity 標準の member dialog は編集のたびに閉じて本文へ戻るため使わない。
          // 編集 UI は gdocsStudioPlugin の自前 Dialog に任せる。
        },
        // 装飾ブロック（別ファイルで定義・schemas/index.ts に登録済み）。
        // リッチテキストを含むものは中央モーダルで編集する。
        {
          type: "speechBubble",
          title: "吹き出し",
          options: { modal: { type: "dialog", width: 1 } },
        },
        {
          type: "titledFrame",
          title: "キャプション付きブロック",
          options: { modal: { type: "dialog", width: 2 } },
        },
        {
          type: "customButton",
          title: "ボタン",
          options: { modal: { type: "dialog", width: 1 } },
        },
        {
          type: "accordionBlock",
          title: "アコーディオン（章の折りたたみ）",
          options: { modal: { type: "dialog", width: 2 } },
        },
        {
          type: "qaBlock",
          title: "質問と回答（FAQ）",
          options: { modal: { type: "dialog", width: 2 } },
        },
        {
          type: "relatedArticleCard",
          title: "関連記事カード",
          options: { modal: { type: "dialog", width: 1 } },
        },
        {
          type: "appReachCard",
          title: "アプリ紹介（アプリーチ）",
          options: { modal: { type: "dialog", width: 1 } },
        },
        {
          type: "servicePromoCard",
          title: "サービス紹介カード",
          options: { modal: { type: "dialog", width: 2 } },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "publishedAt",
    },
  },
});

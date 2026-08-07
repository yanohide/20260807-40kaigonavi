import { defineField, defineType } from "sanity";

export default defineType({
  name: "appReachCard",
  title: "アプリ紹介（アプリーチ）",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "アプリ名",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "meta",
      title: "開発者・クレジット（アプリーチリンク除く）",
      type: "string",
      description: "例: Coincheck, Inc.無料posted with",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "appReachLabel",
      title: "アプリーチリンク文言",
      type: "string",
      initialValue: "アプリーチ",
    }),
    defineField({
      name: "appReachUrl",
      title: "アプリーチ URL",
      type: "url",
    }),
    defineField({
      name: "icon",
      title: "アプリアイコン",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", type: "string", title: "代替テキスト" }),
      ],
    }),
    defineField({
      name: "storeBadges",
      title: "ストアバッジ",
      type: "array",
      of: [
        {
          type: "object",
          name: "storeBadge",
          fields: [
            defineField({
              name: "image",
              title: "バッジ画像",
              type: "image",
            }),
            defineField({
              name: "url",
              title: "ストア URL",
              type: "url",
            }),
          ],
          preview: {
            select: { url: "url", media: "image" },
            prepare({ url, media }) {
              return {
                title: url || "ストアバッジ",
                media,
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      meta: "meta",
      media: "icon",
    },
    prepare({ title, meta, media }) {
      return {
        title: title || "（アプリ名なし）",
        subtitle: meta || "アプリーチ",
        media,
      };
    },
  },
});

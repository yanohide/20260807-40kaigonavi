import { defineField, defineType } from "sanity";

export default defineType({
  name: "servicePromoCard",
  title: "サービス紹介カード",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "icon",
      title: "サービスアイコン",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", type: "string", title: "代替テキスト" }),
      ],
    }),
    defineField({
      name: "points",
      title: "おすすめポイント",
      type: "array",
      of: [
        {
          type: "block",
          styles: [{ title: "本文", value: "normal" }],
          lists: [
            { title: "箇条書き", value: "bullet" },
            { title: "番号付き", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "太字", value: "strong" },
              { title: "斜体", value: "em" },
              { title: "黄色マーカー", value: "highlight" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    type: "url",
                    title: "URL",
                  }),
                ],
              },
            ],
          },
        },
      ],
    }),
    defineField({
      name: "detailUrl",
      title: "詳しい内容リンク",
      type: "url",
      validation: (rule) =>
        rule.required().uri({ scheme: ["http", "https"], allowRelative: false }),
    }),
    defineField({
      name: "officialUrl",
      title: "公式サイトリンク",
      type: "url",
      validation: (rule) =>
        rule.required().uri({ scheme: ["http", "https"], allowRelative: false }),
    }),
  ],
  preview: {
    select: { title: "title", media: "icon" },
    prepare({ title, media }) {
      return {
        title: title || "サービス紹介カード",
        subtitle: "アイコン＋ポイント＋2ボタン",
        media,
      };
    },
  },
});

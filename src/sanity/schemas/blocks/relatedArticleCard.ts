import { defineField, defineType } from "sanity";

export default defineType({
  name: "relatedArticleCard",
  title: "関連記事カード",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "ラベル",
      type: "string",
      initialValue: "あわせて読みたい",
    }),
    defineField({
      name: "title",
      title: "タイトル",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      title: "リンク先 URL",
      type: "url",
      validation: (rule) =>
        rule.required().uri({
          scheme: ["http", "https"],
          allowRelative: true,
        }),
    }),
    defineField({
      name: "image",
      title: "サムネイル",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", type: "string", title: "代替テキスト" }),
      ],
    }),
    defineField({
      name: "excerpt",
      title: "抜粋",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "url",
      media: "image",
    },
  },
});

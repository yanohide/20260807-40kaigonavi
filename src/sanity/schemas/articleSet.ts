import { defineField, defineType } from "sanity";

/** トップの人気・おすすめ記事など、サイト全体の表示設定（1件だけ） */
export default defineType({
  name: "article-set",
  title: "サイト設定",
  type: "document",
  fields: [
    defineField({
      name: "popularPosts",
      title: "人気記事",
      description: "サイドバー「人気記事」に表示する記事（最大3件・上から順）",
      type: "array",
      of: [{ type: "reference", to: [{ type: "post" }] }],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: "recommendedPosts",
      title: "おすすめ記事",
      description: "サイドバー「おすすめ記事」に表示する記事（最大3件・上から順）",
      type: "array",
      of: [{ type: "reference", to: [{ type: "post" }] }],
      validation: (rule) => rule.max(3),
    }),
  ],
  preview: {
    prepare: () => ({ title: "サイト設定" }),
  },
});

import { defineField, defineType } from "sanity";

export default defineType({
  name: "sourceList",
  title: "出典一覧",
  type: "object",
  fields: [
    defineField({
      name: "sources",
      title: "出典",
      type: "array",
      of: [
        {
          type: "object",
          name: "sourceItem",
          fields: [
            defineField({
              name: "title",
              title: "タイトル",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "url",
              title: "URL（リンクにはせず、テキストとして表示します）",
              type: "string",
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "url" },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { sources: "sources" },
    prepare({ sources }) {
      const count = Array.isArray(sources) ? sources.length : 0;
      return { title: "出典一覧", subtitle: `${count}件` };
    },
  },
});

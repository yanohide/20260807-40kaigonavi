import { defineArrayMember, defineField, defineType } from "sanity";

import { QaBlockInlineInput } from "../../components/QaBlockInlineInput";

/**
 * 質問と回答（FAQ 専用）。
 * items[] に複数の「質問＋回答」セットをまとめる。
 * 編集 UI は入れ子ダイアログを使わず、ブロック編集モーダル内で直接入力する
 * （ネスト PTE だと入力中に一覧へ戻りやすいため）。
 */
export default defineType({
  name: "qaBlock",
  title: "質問と回答（FAQ）",
  type: "object",
  components: {
    input: QaBlockInlineInput,
  },
  fields: [
    defineField({
      name: "items",
      title: "Q&A 一覧",
      type: "array",
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          name: "qaItem",
          title: "質問と回答",
          type: "object",
          fields: [
            defineField({
              name: "question",
              title: "質問",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "summary",
              title: "回答",
              type: "string",
            }),
            defineField({
              name: "answer",
              title: "回答本文",
              type: "array",
              of: [
                defineArrayMember({
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
                }),
              ],
            }),
          ],
          preview: {
            select: { title: "question", subtitle: "summary" },
            prepare({ title, subtitle }) {
              return {
                title: title || "（質問なし）",
                subtitle: subtitle || "",
              };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare({ items }) {
      const count = Array.isArray(items) ? items.length : 0;
      const first = Array.isArray(items) && items[0]?.question;
      return {
        title: first || "質問と回答（FAQ）",
        subtitle: `FAQ・${count} 件`,
      };
    },
  },
});

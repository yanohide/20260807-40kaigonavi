import { defineArrayMember, defineField, defineType } from "sanity";

import { StablePtTextInput } from "../../components/StablePtTextInput";

/**
 * アコーディオン（章の折りたたみ）。
 * 役割は H2 見出し相当の「章タイトル」＋その下に折りたたまれる本文。
 * FAQ 用の qaBlock とは別物。
 */
export default defineType({
  name: "accordionBlock",
  title: "アコーディオン（章の折りたたみ）",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "見出し（章タイトル）",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "本文（折りたたみ内）",
      type: "array",
      description:
        "入力中にダイアログが閉じないよう、安定したテキスト欄で編集します。",
      components: {
        input: StablePtTextInput,
      },
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "本文", value: "normal" },
            { title: "見出し3", value: "h3" },
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
    select: { title: "title" },
    prepare({ title }) {
      return {
        title: title || "（見出しなし）",
        subtitle: "アコーディオン（章の折りたたみ）",
      };
    },
  },
});

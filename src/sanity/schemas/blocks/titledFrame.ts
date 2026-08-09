import { defineArrayMember, defineField, defineType } from "sanity";

import { TitledFrameInlineInput } from "../../components/TitledFrameInlineInput";

/**
 * キャプション付き囲み枠。
 * 編集 UI はネスト PTE ではなくモーダル内の直接入力（IME 安定）。
 */
export default defineType({
  name: "titledFrame",
  title: "囲み枠付きボックス",
  type: "object",
  components: {
    input: TitledFrameInlineInput,
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "style",
      title: "タイトルの見え方",
      type: "string",
      options: {
        list: [
          { title: "帯（枠の上に紺帯・白文字）", value: "band" },
          { title: "枠上辺に挟む（左・紺文字）", value: "edge" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "band",
    }),
    defineField({
      name: "avatar",
      title: "右の丸アイコン",
      type: "image",
      description: "設定すると枠内が左：本文／右：丸画像になります（プロフィール枠向け）",
      options: { hotspot: true },
    }),
    defineField({
      name: "avatarCaption",
      title: "丸アイコン下の名前",
      type: "string",
      description: "例：ひよこ忍者",
      hidden: ({ parent }) => !parent?.avatar,
    }),
    defineField({
      name: "body",
      title: "本文",
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
    select: { title: "title", style: "style" },
    prepare({ title, style }) {
      const styleLabel =
        style === "edge" ? "枠上辺に挟む" : "帯スタイル";
      return {
        title: title || "（タイトルなし）",
        subtitle: `キャプション付きブロック・${styleLabel}`,
      };
    },
  },
});

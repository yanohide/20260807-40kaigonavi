import { defineField, defineType } from "sanity";

export default defineType({
  name: "speechBubble",
  title: "吹き出し",
  type: "object",
  fields: [
    defineField({
      name: "speaker",
      title: "話し手",
      type: "string",
      options: {
        list: [
          { title: "質問者（左）", value: "質問者" },
          { title: "ひよこ忍者（右）", value: "ひよこ忍者" },
          { title: "ヤノヒデ（右・旧）", value: "ヤノヒデ" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "質問者",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "icon",
      title: "アイコン画像",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "position",
      title: "配置",
      type: "string",
      options: {
        list: [
          { title: "左（質問者）", value: "left" },
          { title: "右（ひよこ忍者）", value: "right" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "left",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "text",
      title: "本文",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      text: "text",
      position: "position",
      speaker: "speaker",
      media: "icon",
    },
    prepare({ text, position, speaker, media }) {
      const who =
        speaker || (position === "right" ? "ひよこ忍者" : "質問者");
      const side = position === "right" ? "右" : "左";
      return {
        title: text || "（本文なし）",
        subtitle: `吹き出し・${who}・${side}`,
        media,
      };
    },
  },
});

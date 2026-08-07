import { defineField, defineType } from "sanity";

import { CustomButtonInlineInput } from "../../components/CustomButtonInlineInput";

export default defineType({
  name: "customButton",
  title: "ボタン",
  type: "object",
  components: {
    input: CustomButtonInlineInput,
  },
  fields: [
    defineField({
      name: "eyebrow",
      title: "上部マイクロコピー",
      type: "string",
      description:
        "ボタン上に表示（表示時に ＼ ／ で挟みます）。MD入稿時は直前本文・訴求商品から自動設定。独自文言は ＼…／ で上書き可",
    }),
    defineField({
      name: "text",
      title: "ボタンのテキスト",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      title: "リンク先 URL",
      type: "url",
      validation: (rule) =>
        rule.required().uri({
          scheme: ["http", "https", "mailto", "tel"],
          allowRelative: true,
        }),
    }),
    defineField({
      name: "glow",
      title: "見た目",
      type: "boolean",
      description: "光るタイプは発光＋キラッと流れるハイライトが付きます。",
      initialValue: true,
    }),
    defineField({
      name: "color",
      title: "色",
      type: "string",
      options: {
        list: [
          { title: "レッド（アクセント・推奨）", value: "red" },
          { title: "ゴールド", value: "gold" },
          { title: "ネイビー", value: "navy" },
          { title: "ブルー", value: "blue" },
          { title: "グリーン", value: "green" },
          { title: "ボルドー", value: "burgundy" },
          { title: "アウトライン（枠のみ）", value: "outline" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "red",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "newTab",
      title: "別タブで開く",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "text",
      eyebrow: "eyebrow",
      url: "url",
      color: "color",
      glow: "glow",
    },
    prepare({ title, eyebrow, url, color, glow }) {
      const glowLabel = glow ? "光る" : "光らない";
      const eye = eyebrow ? `＼${eyebrow}／・` : "";
      return {
        title: title || "（テキストなし）",
        subtitle: `${eye}ボタン・${glowLabel}・${color ?? "navy"}${url ? ` → ${url}` : ""}`,
      };
    },
  },
});

"use client";

import { jaJPLocale } from "@sanity/locale-ja-jp";
import { table } from "@sanity/table";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { previewDraftAction } from "./src/sanity/actions/previewAction";
import { createJapanesePublishAction } from "./src/sanity/actions/publishAction";
import { PostDocumentLayout } from "./src/sanity/components/PostDocumentLayout";
import { gdocsStudioPlugin } from "./src/sanity/plugins/gdocsStudioPlugin";
import { structure } from "./src/sanity/structure";
import schemas from "./src/sanity/schemas";

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ||
  process.env.SANITY_STUDIO_PROJECT_ID?.trim() ||
  "";
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() ||
  process.env.SANITY_STUDIO_DATASET?.trim() ||
  "production";

if (!projectId) {
  throw new Error(
    "`.env.local` に NEXT_PUBLIC_SANITY_PROJECT_ID を設定してください。",
  );
}

export default defineConfig({
  name: "40kaigonavi",
  title: "40歳からの介護ナビ 記事管理",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    jaJPLocale(),
    structureTool({ structure }),
    gdocsStudioPlugin(),
    table(),
  ],
  schema: { types: schemas },
  document: {
    components: {
      // 記事ドキュメント上部に「プレビューを見る」「公開する」帯を表示
      unstable_layout: PostDocumentLayout,
    },
    actions: (prev, context) => {
      const withJapanesePublish = prev.map((action) =>
        action.action === "publish"
          ? createJapanesePublishAction(action)
          : action,
      );

      if (context.schemaType !== "post") return withJapanesePublish;
      // プレビューは Publish の直後に置く（フッターの主ボタンは公開のまま）
      const withoutDupPreview = withJapanesePublish.filter(
        (action) => action.displayName !== "PreviewDraftAction",
      );
      const publishIdx = withoutDupPreview.findIndex(
        (action) => action.action === "publish",
      );
      if (publishIdx === -1) {
        return [previewDraftAction, ...withoutDupPreview];
      }
      return [
        ...withoutDupPreview.slice(0, publishIdx + 1),
        previewDraftAction,
        ...withoutDupPreview.slice(publishIdx + 1),
      ];
    },
  },
});

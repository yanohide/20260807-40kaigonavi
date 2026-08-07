import { PublishIcon } from "@sanity/icons";
import type { DocumentActionComponent, DocumentActionProps } from "sanity";

/**
 * 標準の Publish アクションを「公開する」ラベルに差し替える。
 */
export function createJapanesePublishAction(
  OriginalPublish: DocumentActionComponent,
): DocumentActionComponent {
  const JapanesePublish: DocumentActionComponent = (
    props: DocumentActionProps,
  ) => {
    const original = OriginalPublish(props);
    if (!original) return null;

    const raw = String(original.label ?? "");
    let label = "公開する";
    if (/published|公開済/i.test(raw)) label = "公開済み";
    else if (/publishing|running|公開中/i.test(raw)) label = "公開中…";

    return {
      ...original,
      label,
      icon: original.icon ?? PublishIcon,
    };
  };

  JapanesePublish.action = "publish";
  JapanesePublish.displayName = "JapanesePublishAction";
  return JapanesePublish;
}

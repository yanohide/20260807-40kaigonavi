import { EyeOpenIcon } from "@sanity/icons";
import type { DocumentActionComponent, DocumentActionProps } from "sanity";
import { openDraftPreview } from "../lib/previewUrl";

type SlugValue = { slug?: { current?: string } };

/**
 * 記事の「プレビューを見る」アクション。
 * 下書き（未公開）の内容で、Next.js 側の公開後レイアウトを別タブで開く。
 */
export const previewDraftAction: DocumentActionComponent = (
  props: DocumentActionProps,
) => {
  const doc = (props.draft || props.published) as Partial<SlugValue> | null;
  const slug = doc?.slug?.current;
  const hasDraft = Boolean(props.draft);

  return {
    label: "プレビューを見る",
    icon: EyeOpenIcon,
    disabled: !slug,
    // ヘッダー横にも出す（⋮ メニュー以外）
    group: ["paneActions", "default"],
    title: slug
      ? hasDraft
        ? "下書きの状態で公開後の見た目をプレビュー"
        : "公開済みの見た目をプレビュー"
      : "スラッグを入力するとプレビューできます",
    onHandle: () => {
      if (!slug) {
        props.onComplete();
        return;
      }

      if (typeof window !== "undefined") {
        openDraftPreview(slug);
      }
      props.onComplete();
    },
  };
};

previewDraftAction.displayName = "PreviewDraftAction";

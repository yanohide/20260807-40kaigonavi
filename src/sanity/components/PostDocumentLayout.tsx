"use client";

import { EyeOpenIcon, PublishIcon } from "@sanity/icons";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { useCallback, useState } from "react";
import {
  useDocumentOperation,
  useEditState,
  useValidationStatus,
  type DocumentLayoutProps,
} from "sanity";
import { openDraftPreview } from "../lib/previewUrl";

type SlugDoc = {
  slug?: { current?: string };
};

/**
 * 記事ドキュメント上部の操作帯。
 * 下書きがあるとき「プレビューを見る」「公開する」を並べて出す。
 * ※ unstable_layout は FormValueProvider の外なので useFormValue は使えない。
 */
function DraftActionBar({
  documentId,
  documentType,
}: {
  documentId: string;
  documentType: string;
}) {
  const publishedId = documentId.replace(/^drafts\./, "");
  const editState = useEditState(publishedId, documentType);
  const { publish } = useDocumentOperation(publishedId, documentType);
  const { validation } = useValidationStatus(publishedId, documentType, false);

  const [publishing, setPublishing] = useState(false);

  const draftDoc = editState.draft as SoftSlug | null;
  const publishedDoc = editState.published as SoftSlug | null;
  const isDraft = Boolean(editState.draft);
  const slugCurrent =
    draftDoc?.slug?.current || publishedDoc?.slug?.current || undefined;

  const hasValidationErrors = validation.some(
    (marker) => marker.level === "error",
  );

  const openPreview = useCallback(() => {
    if (!slugCurrent) return;
    openDraftPreview(slugCurrent);
  }, [slugCurrent]);

  const handlePublish = useCallback(() => {
    if (publish.disabled || hasValidationErrors) return;
    setPublishing(true);
    publish.execute();
    window.setTimeout(() => setPublishing(false), 2500);
  }, [hasValidationErrors, publish]);

  if (!isDraft) return null;

  return (
    <Card
      padding={3}
      marginBottom={4}
      radius={2}
      shadow={1}
      tone="caution"
      border
    >
      <Stack space={3}>
        <Text size={1} weight="semibold">
          下書きの状態です
        </Text>
        <Text size={1} muted>
          公開前にプレビューで見た目を確認できます。問題なければ「公開する」を押してください。
        </Text>
        <Flex gap={2} wrap="wrap">
          <Button
            icon={EyeOpenIcon}
            text="プレビューを見る"
            mode="ghost"
            tone="primary"
            fontSize={1}
            padding={3}
            disabled={!slugCurrent}
            title={
              slugCurrent
                ? "下書きの内容で公開後の見た目を開く"
                : "スラッグを入力するとプレビューできます"
            }
            onClick={openPreview}
          />
          <Button
            icon={PublishIcon}
            text={publishing ? "公開中…" : "公開する"}
            tone="positive"
            fontSize={1}
            padding={3}
            disabled={
              publishing || Boolean(publish.disabled) || hasValidationErrors
            }
            title={
              hasValidationErrors
                ? "入力エラーを直すと公開できます"
                : publish.disabled
                  ? String(publish.disabled)
                  : "下書きを公開する"
            }
            onClick={handlePublish}
          />
        </Flex>
      </Stack>
    </Card>
  );
}

type SoftSlug = SlugDoc;

/** 記事（post）だけ下書き用ボタン帯を差し込むレイアウト */
export function PostDocumentLayout(props: DocumentLayoutProps) {
  if (props.documentType !== "post") {
    return props.renderDefault(props);
  }

  return (
    <Box>
      <DraftActionBar
        documentId={props.documentId}
        documentType={props.documentType}
      />
      {props.renderDefault(props)}
    </Box>
  );
}

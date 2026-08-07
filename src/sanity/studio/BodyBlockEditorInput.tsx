// @ts-nocheck
"use client";

import { Box, Text } from "@sanity/ui";
import type { InputProps } from "sanity";

/** WordPress-style unified block editor wrapper for the post `body` field. */
export default function BodyBlockEditorInput(props: InputProps) {
  return (
    <Box className="cryptoblog-block-editor">
      <Text size={1} muted className="cryptoblog-block-editor__hint">
        段落・画像を、WordPress
        ブロックエディタのように自由な順序で組み立てられます。ブロック間の「＋」や左のメニューから追加できます。
      </Text>
      {props.renderDefault(props)}
    </Box>
  );
}

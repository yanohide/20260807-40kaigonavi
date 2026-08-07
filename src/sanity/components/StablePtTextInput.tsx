"use client";

import { Stack, Text, TextArea } from "@sanity/ui";
import { uuid } from "@sanity/uuid";
import { useEffect, useRef, useState } from "react";
import {
  set,
  unset,
  type ArrayOfObjectsInputProps,
  type PortableTextBlock,
} from "sanity";

type SpanChild = {
  _type: "span";
  _key: string;
  text: string;
  marks?: string[];
};

type TextBlock = PortableTextBlock & {
  children?: SpanChild[];
  listItem?: "bullet" | "number";
  level?: number;
  style?: string;
};

function newKey() {
  return uuid().replace(/-/g, "").slice(0, 12);
}

/** Portable Text → テキスト（行頭の・/数字で箇条書きを復元しやすい形） */
export function blocksToPlainText(blocks: unknown): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return "";

  return blocks
    .map((raw) => {
      const block = raw as TextBlock;
      if (block?._type !== "block") return "";
      const text = (block.children ?? [])
        .map((child) => (child?._type === "span" ? child.text ?? "" : ""))
        .join("");

      if (block.listItem === "bullet") return `・${text}`;
      if (block.listItem === "number") return `1. ${text}`;
      return text;
    })
    .join("\n");
}

/** テキスト → Portable Text（空行は空段落、・/- は箇条書き、1. は番号付き） */
export function plainTextToBlocks(text: string): TextBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines.length === 1 && lines[0] === "") return [];

  return lines.map((line) => {
    let listItem: "bullet" | "number" | undefined;
    let content = line;

    if (/^[-*・]\s?/.test(content)) {
      listItem = "bullet";
      content = content.replace(/^[-*・]\s?/, "");
    } else if (/^\d+[.)．、]\s?/.test(content)) {
      listItem = "number";
      content = content.replace(/^\d+[.)．、]\s?/, "");
    }

    const block: TextBlock = {
      _type: "block",
      _key: newKey(),
      style: "normal",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: newKey(),
          text: content,
          marks: [],
        },
      ],
    };

    if (listItem) {
      block.listItem = listItem;
      block.level = 1;
    }

    return block;
  });
}

/**
 * ネストしたダイアログ内の Portable Text の代わり。
 * 入力中はローカル state だけ更新し、blur 時にだけドキュメントへ書く
 * （表セルと同じ策略。日本語 IME と相性が良い）。
 */
export function StablePtTextInput(props: ArrayOfObjectsInputProps) {
  const value = props.value as TextBlock[] | undefined;
  const [local, setLocal] = useState(() => blocksToPlainText(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setLocal(blocksToPlainText(value));
    }
  }, [value]);

  const commit = () => {
    const prev = blocksToPlainText(value);
    if (local === prev) return;
    const next = plainTextToBlocks(local);
    props.onChange(next.length > 0 ? set(next) : unset());
  };

  return (
    <Stack space={2}>
      <Text size={1} muted>
        改行で段落を分けます。行頭を「・」にすると箇条書き、「1.」にすると番号付きになります。入力の確定はフォーカスを外したときです。
      </Text>
      <TextArea
        value={local}
        rows={10}
        fontSize={2}
        padding={3}
        onChange={(event) => setLocal(event.currentTarget.value)}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={() => {
          focusedRef.current = false;
          commit();
        }}
        onKeyDown={(event) => {
          // Escape / Tab は外側ダイアログへ伝播させない
          if (event.key === "Escape" || event.key === "Esc") {
            event.stopPropagation();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === "Escape" || event.key === "Esc") {
            event.stopPropagation();
          }
        }}
      />
    </Stack>
  );
}

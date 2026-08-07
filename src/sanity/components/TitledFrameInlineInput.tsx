"use client";

import { Button, Flex, Stack, Text, TextArea, TextInput } from "@sanity/ui";
import { useEffect, useRef, useState } from "react";
import { set, type ObjectInputProps } from "sanity";

import {
  blocksToPlainText,
  plainTextToBlocks,
} from "./StablePtTextInput";

type TitledFrameValue = {
  _type?: string;
  _key?: string;
  title?: string;
  style?: "band" | "edge" | string;
  body?: unknown;
};

/**
 * キャプション付きボックスをモーダル内だけで完結編集する。
 * ネストした Portable Text 入力はフォーカス喪失・値が消える不具合が出やすいため、
 * Q&A と同様に TextArea（blur で Portable Text へ保存）へ置き換える。
 */
export function TitledFrameInlineInput(props: ObjectInputProps) {
  const value = (props.value as TitledFrameValue | undefined) ?? {};
  const style = value.style === "edge" ? "edge" : "band";

  const writeTitle = (title: string) => {
    props.onChange(set(title, ["title"]));
  };

  const writeStyle = (next: "band" | "edge") => {
    props.onChange(set(next, ["style"]));
  };

  const writeBody = (body: ReturnType<typeof plainTextToBlocks>) => {
    props.onChange(set(body, ["body"]));
  };

  return (
    <Stack space={4}>
      <Text size={1} muted>
        タイトルと本文をこの画面で入力します。本文の確定はフォーカスを外したときです。
      </Text>

      <Stack space={2}>
        <Text size={1} weight="medium">
          タイトル
        </Text>
        <BlurTextInput
          value={value.title ?? ""}
          placeholder="枠のキャプション"
          onCommit={writeTitle}
        />
      </Stack>

      <Stack space={2}>
        <Text size={1} weight="medium">
          タイトルの見え方
        </Text>
        <Flex gap={2} wrap="wrap">
          <StyleChip
            active={style === "band"}
            label="帯（紺帯・白文字）"
            onClick={() => writeStyle("band")}
          />
          <StyleChip
            active={style === "edge"}
            label="枠上辺に挟む（紺文字）"
            onClick={() => writeStyle("edge")}
          />
        </Flex>
      </Stack>

      <Stack space={2}>
        <Text size={1} weight="medium">
          本文
        </Text>
        <Text size={1} muted>
          改行で段落。「・」で箇条書き、「1.」で番号付き。
        </Text>
        <BlurBodyInput value={value.body} onCommit={writeBody} />
      </Stack>
    </Stack>
  );
}

function StyleChip(props: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      mode={props.active ? "default" : "ghost"}
      tone={props.active ? "primary" : "default"}
      text={props.label}
      fontSize={1}
      padding={3}
      onClick={props.onClick}
    />
  );
}

function BlurTextInput(props: {
  value: string;
  placeholder?: string;
  onCommit: (next: string) => void;
}) {
  const { value, placeholder, onCommit } = props;
  const [local, setLocal] = useState(value);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setLocal(value);
  }, [value]);

  return (
    <TextInput
      value={local}
      placeholder={placeholder}
      fontSize={2}
      padding={3}
      onChange={(event) => setLocal(event.currentTarget.value)}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        if (local !== value) onCommit(local);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.stopPropagation();
      }}
    />
  );
}

function BlurBodyInput(props: {
  value: unknown;
  onCommit: (blocks: ReturnType<typeof plainTextToBlocks>) => void;
}) {
  const { value, onCommit } = props;
  const [local, setLocal] = useState(() => blocksToPlainText(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setLocal(blocksToPlainText(value));
  }, [value]);

  return (
    <TextArea
      value={local}
      rows={12}
      fontSize={2}
      padding={3}
      onChange={(event) => setLocal(event.currentTarget.value)}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        const prev = blocksToPlainText(value);
        if (local === prev) return;
        onCommit(plainTextToBlocks(local));
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.stopPropagation();
      }}
      onKeyUp={(event) => {
        if (event.key === "Escape") event.stopPropagation();
      }}
    />
  );
}

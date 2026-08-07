"use client";

import { Checkbox, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { useEffect, useRef, useState } from "react";
import { set, type ObjectInputProps } from "sanity";

type ButtonColor =
  | "navy"
  | "red"
  | "blue"
  | "green"
  | "gold"
  | "burgundy"
  | "outline";

type CustomButtonValue = {
  _type?: string;
  _key?: string;
  eyebrow?: string;
  text?: string;
  url?: string;
  color?: ButtonColor | string;
  glow?: boolean;
  newTab?: boolean;
};

const COLORS: { value: ButtonColor; label: string }[] = [
  { value: "red", label: "レッド（アクセント・推奨）" },
  { value: "gold", label: "ゴールド" },
  { value: "navy", label: "ネイビー" },
  { value: "blue", label: "ブルー" },
  { value: "green", label: "グリーン" },
  { value: "burgundy", label: "ボルドー" },
  { value: "outline", label: "アウトライン（枠のみ）" },
];

/**
 * ボタンブロック用の安定入力。
 * ダイアログ内でキー入力のたびにフォーカスが外れて本文に戻るのを防ぐため、
 * テキスト／URL は blur 時にだけパッチする。
 */
export function CustomButtonInlineInput(props: ObjectInputProps) {
  const value = (props.value as CustomButtonValue | undefined) ?? {};
  const color = (value.color as ButtonColor | undefined) || "red";
  const glow = value.glow !== false;

  return (
    <Stack space={4}>
      <Text size={1} muted>
        テキストと URL の確定は、欄の外をクリックしたときです。
      </Text>

      <Stack space={2}>
        <Text size={1} weight="medium">
          上部マイクロコピー（＼ ／ で表示）
        </Text>
        <BlurTextInput
          value={value.eyebrow ?? ""}
          placeholder="平均10秒で自動損益計算"
          onCommit={(eyebrow) => props.onChange(set(eyebrow, ["eyebrow"]))}
        />
      </Stack>

      <Stack space={2}>
        <Text size={1} weight="medium">
          ボタンのテキスト
        </Text>
        <BlurTextInput
          value={value.text ?? ""}
          placeholder="詳しく見る"
          onCommit={(text) => props.onChange(set(text, ["text"]))}
        />
      </Stack>

      <Stack space={2}>
        <Text size={1} weight="medium">
          リンク先 URL
        </Text>
        <BlurTextInput
          value={value.url ?? ""}
          placeholder="https://example.com"
          onCommit={(url) => props.onChange(set(url, ["url"]))}
        />
      </Stack>

      <Stack space={2}>
        <Text size={1} weight="medium">
          見た目
        </Text>
        <Flex gap={2} wrap="wrap">
          <StyleChip
            active={!glow}
            label="光らない"
            onClick={() => props.onChange(set(false, ["glow"]))}
          />
          <StyleChip
            active={glow}
            label="光る"
            onClick={() => props.onChange(set(true, ["glow"]))}
          />
        </Flex>
      </Stack>

      <Stack space={2}>
        <Text size={1} weight="medium">
          色
        </Text>
        <Flex gap={2} wrap="wrap">
          {COLORS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => props.onChange(set(item.value, ["color"]))}
              style={{
                border:
                  color === item.value
                    ? "2px solid #1a73e8"
                    : "1px solid #dadce0",
                borderRadius: 6,
                padding: "6px 10px",
                background: color === item.value ? "#e8f0fe" : "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {item.label}
            </button>
          ))}
        </Flex>
      </Stack>

      <Flex align="center" gap={3}>
        <Checkbox
          id="custom-button-newtab"
          checked={value.newTab !== false}
          onChange={(event) =>
            props.onChange(set(event.currentTarget.checked, ["newTab"]))
          }
        />
        <Text size={1}>
          <label htmlFor="custom-button-newtab">別タブで開く</label>
        </Text>
      </Flex>
    </Stack>
  );
}

function StyleChip(props: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{
        border: props.active ? "2px solid #1a73e8" : "1px solid #dadce0",
        borderRadius: 6,
        padding: "6px 12px",
        background: props.active ? "#e8f0fe" : "#fff",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: props.active ? 600 : 400,
      }}
    >
      {props.label}
    </button>
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

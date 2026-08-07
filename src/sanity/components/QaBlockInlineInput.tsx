"use client";

import { AddIcon, TrashIcon } from "@sanity/icons";
import { Button, Card, Flex, Stack, Text, TextArea, TextInput } from "@sanity/ui";
import { uuid } from "@sanity/uuid";
import { useCallback, useEffect, useRef, useState } from "react";
import { set, type ObjectInputProps } from "sanity";

import {
  blocksToPlainText,
  plainTextToBlocks,
} from "./StablePtTextInput";

type QaItem = {
  _key: string;
  _type?: string;
  question?: string;
  summary?: string;
  answer?: unknown;
};

type QaBlockValue = {
  _type?: string;
  _key?: string;
  items?: QaItem[];
};

function newKey() {
  return uuid().replace(/-/g, "").slice(0, 12);
}

function emptyItem(): QaItem {
  return {
    _key: newKey(),
    _type: "qaItem",
    question: "",
    summary: "",
    answer: [],
  };
}

/**
 * Q&A を「一覧 → もう一段の編集ダイアログ」ではなく、
 * このモーダル内で全部入力できるようにする。
 * 回答本文は IME 安定の TextArea（blur で Portable Text へ保存）。
 */
export function QaBlockInlineInput(props: ObjectInputProps) {
  const value = (props.value as QaBlockValue | undefined) ?? {};
  const items = Array.isArray(value.items) ? value.items : [];

  const writeItems = useCallback(
    (next: QaItem[]) => {
      props.onChange(set(next.length > 0 ? next : [emptyItem()], ["items"]));
    },
    [props],
  );

  const updateItem = (index: number, patch: Partial<QaItem>) => {
    const base = items.length > 0 ? items : [emptyItem()];
    const next = base.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    writeItems(next);
  };

  const addItem = () => {
    writeItems([...(items.length > 0 ? items : [emptyItem()]), emptyItem()]);
  };

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    writeItems(next.length > 0 ? next : [emptyItem()]);
  };

  // 初回で items が空なら1件用意
  useEffect(() => {
    if (!Array.isArray(value.items) || value.items.length === 0) {
      props.onChange(set([emptyItem()], ["items"]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初期化のみ
  }, []);

  return (
    <Stack space={4}>
      <Text size={1} muted>
        質問と回答のセットをここに並べて編集します。別画面の「一覧」へ飛ばずに入力できます。
      </Text>

      {(items.length > 0 ? items : [emptyItem()]).map((item, index) => (
        <QaItemCard
          key={item._key || index}
          index={index}
          item={item}
          canRemove={items.length > 1}
          onChange={(patch) => updateItem(index, patch)}
          onRemove={() => removeItem(index)}
        />
      ))}

      <Flex>
        <Button
          icon={AddIcon}
          text="質問と回答を追加"
          mode="ghost"
          tone="primary"
          fontSize={1}
          padding={3}
          onClick={addItem}
        />
      </Flex>
    </Stack>
  );
}

function QaItemCard(props: {
  index: number;
  item: QaItem;
  canRemove: boolean;
  onChange: (patch: Partial<QaItem>) => void;
  onRemove: () => void;
}) {
  const { index, item, canRemove, onChange, onRemove } = props;

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            セット {index + 1}
          </Text>
          <Button
            icon={TrashIcon}
            mode="bleed"
            tone="critical"
            fontSize={1}
            padding={2}
            disabled={!canRemove}
            title={canRemove ? "このセットを削除" : "最低1件必要です"}
            onClick={onRemove}
          />
        </Flex>

        <Stack space={2}>
          <Text size={1} weight="medium">
            質問
          </Text>
          <BlurTextInput
            value={item.question ?? ""}
            placeholder="質問を入力"
            onCommit={(next) => onChange({ question: next })}
          />
        </Stack>

        <Stack space={2}>
          <Text size={1} weight="medium">
            回答
          </Text>
          <BlurTextInput
            value={item.summary ?? ""}
            placeholder="回答を入力"
            onCommit={(next) => onChange({ summary: next })}
          />
        </Stack>

        <Stack space={2}>
          <Text size={1} weight="medium">
            回答本文
          </Text>
          <Text size={1} muted>
            改行で段落。「・」で箇条書き、「1.」で番号付き。確定はフォーカスを外したとき。
          </Text>
          <BlurAnswerInput
            value={item.answer}
            onCommit={(blocks) => onChange({ answer: blocks })}
          />
        </Stack>
      </Stack>
    </Card>
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

function BlurAnswerInput(props: {
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
      rows={8}
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
    />
  );
}

// @ts-nocheck
"use client";

// Studio 用スタイルはプラグイン側で読み込む。
// こうすると Next.js 埋め込み Studio（/studio）だけでなく、
// `sanity dev`（npm run studio）の単体 Studio でも同じ見た目になる。
import "../studio/studio-gdocs-editor.css";
import "../studio/block-editor.css";

import { AddIcon, RemoveIcon, TrashIcon } from "@sanity/icons";
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Inline,
  Stack,
  Text,
  TextArea,
} from "@sanity/ui";
import { uuid } from "@sanity/uuid";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { BlockProps, LayoutProps } from "sanity";
import {
  definePlugin,
  type InputProps,
  set,
  useClient,
  useFormValue,
} from "sanity";

import BodyBlockEditorInput from "../studio/BodyBlockEditorInput";
import { StudioPaneWidthResizer } from "../components/StudioPaneWidthResizer";

const ROW_TYPE = "tableRow";

type TableRow = { _key: string; _type?: string; cells: string[] };
type TableValue = { _key?: string; _type?: string; rows?: TableRow[] };

/** patch で入力が再マウントしても、編集中ダイアログを閉じないための記憶。 */
const openTableEditorKeys = new Set<string>();

function tableEditorIdentity(props: InputProps, blockKey?: string) {
  if (typeof blockKey === "string" && blockKey.length > 0) return blockKey;
  if (typeof props.id === "string" && props.id.length > 0) return props.id;
  return "table-pending";
}

/**
 * セル1つ分の入力欄（複数行対応）。
 * 入力中（フォーカス中）はローカル state だけを更新し、ドキュメントへは
 * フォーカスを外したときにだけ保存する。
 * 高さ自動調整時に背後の文書ペイン／ダイアログが上下に跳ねるのを防ぐ。
 */
function TableCellInput(props: {
  value: string;
  onCommit: (next: string) => void;
}) {
  const { value, onCommit } = props;
  const [local, setLocal] = useState(value ?? "");
  const focusedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // フォーカスしていないセルだけ、外部からの値変更を反映する。
  useEffect(() => {
    if (!focusedRef.current) setLocal(value ?? "");
  }, [value]);

  const resizeWithoutScrollJump = () => {
    const el = textareaRef.current;
    if (!el) return;

    // 高さ変更の前後で、祖先のスクロール位置を記憶して戻す
    const locked: { node: Element; top: number }[] = [];
    let node: Element | null = el;
    while (node) {
      if (node instanceof HTMLElement) {
        const { overflowY } = getComputedStyle(node);
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight + 1
        ) {
          locked.push({ node, top: node.scrollTop });
        }
      }
      node = node.parentElement;
    }
    const panel = document.querySelector(
      '[data-testid="document-panel-scroller"]',
    );
    if (panel instanceof HTMLElement) {
      locked.push({ node: panel, top: panel.scrollTop });
    }
    const winY = window.scrollY;

    // height:auto にすると一瞬潰れてジャンプするので、1px 測定 → 反映
    el.style.height = "1px";
    el.style.height = `${Math.max(el.scrollHeight, 36)}px`;

    for (const item of locked) {
      item.node.scrollTop = item.top;
    }
    if (window.scrollY !== winY) {
      window.scrollTo({ top: winY, left: 0, behavior: "instant" as ScrollBehavior });
    }
  };

  useEffect(() => {
    resizeWithoutScrollJump();
  }, [local]);

  const commit = () => {
    if (local !== (value ?? "")) onCommit(local);
  };

  return (
    <TextArea
      ref={textareaRef}
      value={local}
      rows={1}
      fontSize={1}
      padding={3}
      radius={0}
      style={{
        border: "none",
        boxShadow: "none",
        background: "transparent",
        resize: "none",
        overflow: "hidden",
        minHeight: 36,
      }}
      onChange={(event) => setLocal(event.currentTarget.value)}
      onFocus={(event) => {
        focusedRef.current = true;
        // Sanity が focus でスクロール合わせしようとするのを抑える
        event.currentTarget.scrollIntoView = () => {};
        resizeWithoutScrollJump();
      }}
      onBlur={() => {
        focusedRef.current = false;
        commit();
      }}
      onKeyDown={(event) => {
        // Escape は IME キャンセル用途。ダイアログ閉じに伝播させない。
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
  );
}

/**
 * IME に強い自作テーブルエディタ。@sanity/table の入力コンポーネントは
 * 1キーごとに patch → 全体再描画するため日本語入力が不安定になる。
 * ここではセル単位でローカル編集し、確定時にまとめて保存する。
 * 行・列の増減もローカル先行 → 直後に patchし、ダイアログが閉じないよう
 * ルートの Escape ガードと併用する。
 */
function TableEditor(props: {
  value: TableValue | undefined;
  onChange: InputProps["onChange"];
}) {
  const { value, onChange } = props;
  const [draftRows, setDraftRows] = useState<TableRow[]>(() => value?.rows ?? []);
  const editingRef = useRef(false);

  // 外部からの値（他タブや初期化）だけ同期。自分の入力中は上書きしない。
  useEffect(() => {
    if (editingRef.current) return;
    setDraftRows(value?.rows ?? []);
  }, [value?.rows, value?._key]);

  const rows = draftRows;
  const colCount = rows[0]?.cells?.length ?? 0;

  const writeRows = (nextRows: TableRow[]) => {
    editingRef.current = true;
    setDraftRows(nextRows);
    onChange(set(nextRows, ["rows"]));
    // 次の tick で外部同期を許可
    queueMicrotask(() => {
      editingRef.current = false;
    });
  };

  const createTable = () => {
    const make = (): TableRow => ({
      _key: uuid(),
      _type: ROW_TYPE,
      cells: ["", ""],
    });
    writeRows([make(), make()]);
  };

  const setCell = (rowIndex: number, cellIndex: number, next: string) => {
    writeRows(
      rows.map((row, ri) =>
        ri === rowIndex
          ? {
              ...row,
              cells: row.cells.map((cell, ci) =>
                ci === cellIndex ? next : cell,
              ),
            }
          : row,
      ),
    );
  };

  const addRow = () => {
    writeRows([
      ...rows,
      {
        _key: uuid(),
        _type: ROW_TYPE,
        cells: Array(Math.max(colCount, 1)).fill(""),
      },
    ]);
  };

  const addColumn = () => {
    writeRows(rows.map((row) => ({ ...row, cells: [...row.cells, ""] })));
  };

  const removeRow = (rowIndex: number) => {
    writeRows(rows.filter((_, ri) => ri !== rowIndex));
  };

  const removeColumn = (cellIndex: number) => {
    writeRows(
      rows.map((row) => ({
        ...row,
        cells: row.cells.filter((_, ci) => ci !== cellIndex),
      })),
    );
  };

  if (rows.length === 0) {
    return (
      <Button
        icon={AddIcon}
        text="表を作成（2×2）"
        tone="primary"
        mode="ghost"
        fontSize={1}
        padding={3}
        onClick={createTable}
      />
    );
  }

  return (
    <Stack space={3}>
      <Box className="cryptoblog-gdocs-table-editor" style={{ overflowX: "auto" }}>
        <table>
          <tbody>
            <tr className="cryptoblog-gdocs-colhandles">
              {Array.from({ length: colCount }).map((_, ci) => (
                <td key={ci} style={{ textAlign: "center", padding: "0 0 4px" }}>
                  <span className="cryptoblog-gdocs-handle">
                    <Button
                      icon={RemoveIcon}
                      mode="bleed"
                      padding={1}
                      fontSize={0}
                      title="この列を削除"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => removeColumn(ci)}
                      disabled={colCount <= 1}
                    />
                  </span>
                </td>
              ))}
              <td style={{ width: 36 }} />
            </tr>
            {rows.map((row, ri) => (
              <tr key={row._key} className="cryptoblog-gdocs-datarow">
                {row.cells.map((cell, ci) => (
                  <td key={ci} className="cryptoblog-gdocs-cell">
                    <TableCellInput
                      value={cell}
                      onCommit={(next) => setCell(ri, ci, next)}
                    />
                  </td>
                ))}
                <td style={{ width: 36, textAlign: "center" }}>
                  <span className="cryptoblog-gdocs-handle">
                    <Button
                      icon={RemoveIcon}
                      mode="bleed"
                      padding={1}
                      fontSize={0}
                      title="この行を削除"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => removeRow(ri)}
                      disabled={rows.length <= 1}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      <Inline space={2}>
        <Button
          icon={AddIcon}
          text="行を追加"
          mode="ghost"
          fontSize={1}
          padding={2}
          onMouseDown={(event) => event.preventDefault()}
          onClick={addRow}
        />
        <Button
          icon={AddIcon}
          text="列を追加"
          mode="ghost"
          fontSize={1}
          padding={2}
          onMouseDown={(event) => event.preventDefault()}
          onClick={addColumn}
        />
      </Inline>
    </Stack>
  );
}

/**
 * 表ブロックの入力。
 * Sanity PTE 標準の member dialog は、行追加やセル確定のたびに閉じて
 * 本文キャンバスへ戻ってしまう。そのため本文側には要約カードだけ置き、
 * 編集はこちらで開く自前 Dialog に閉じ込める（閉じるまで本文に戻らない）。
 */
function TableDialogInput(props: InputProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const client = useClient({ apiVersion: "2024-10-01" });
  const documentId = useFormValue(["_id"]) as string | undefined;
  const value = props.value as TableValue | undefined;
  const blockKey = value?._key;
  const editorId = tableEditorIdentity(props, blockKey);
  const rowCount = value?.rows?.length ?? 0;
  const colCount = value?.rows?.[0]?.cells?.length ?? 0;
  // 新規空表・または再マウント前に開いていた編集を継続
  const [editorOpen, setEditorOpen] = useState(
    () => openTableEditorKeys.has(editorId) || rowCount === 0,
  );

  const openEditor = () => {
    openTableEditorKeys.add(editorId);
    setEditorOpen(true);
  };
  const closeEditor = () => {
    openTableEditorKeys.delete(editorId);
    if (blockKey) openTableEditorKeys.delete(blockKey);
    setEditorOpen(false);
  };

  // blockKey が付いたら pending id から引き継ぐ
  useEffect(() => {
    if (!blockKey || editorId === blockKey) return;
    if (openTableEditorKeys.has(editorId) || editorOpen) {
      openTableEditorKeys.delete(editorId);
      openTableEditorKeys.add(blockKey);
    }
  }, [blockKey, editorId, editorOpen]);

  // 空表挿入時は Set にも載せて再マウント耐性を付ける
  useEffect(() => {
    if (editorOpen) openTableEditorKeys.add(editorId);
  }, [editorOpen, editorId]);

  const deleteTable = async () => {
    if (!documentId || !blockKey) {
      setConfirmDelete(false);
      return;
    }
    try {
      setDeleting(true);
      await client
        .patch(documentId)
        .unset([`body[_key=="${blockKey}"]`])
        .commit({ visibility: "async" });
      closeEditor();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <Card padding={3} radius={2} border tone="transparent">
        <Stack space={3}>
          <Flex align="center" justify="space-between" gap={3}>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                表
              </Text>
              <Text size={1} muted>
                {rowCount > 0
                  ? `${rowCount} 行 × ${colCount} 列`
                  : "まだ表がありません"}
              </Text>
            </Stack>
            <Inline space={2}>
              <Button
                text={rowCount > 0 ? "表を編集" : "表を作成"}
                tone="primary"
                mode="ghost"
                fontSize={1}
                padding={3}
                onClick={openEditor}
              />
              {rowCount > 0 ? (
                <Button
                  icon={TrashIcon}
                  text="削除"
                  tone="critical"
                  mode="bleed"
                  fontSize={1}
                  padding={2}
                  onClick={() => setConfirmDelete(true)}
                />
              ) : null}
            </Inline>
          </Flex>

          {rowCount > 0 ? (
            <Box className="cryptoblog-gdocs-table-editor" style={{ opacity: 0.85 }}>
              <table>
                <tbody>
                  {value!.rows!.slice(0, 4).map((row) => (
                    <tr key={row._key}>
                      {row.cells.slice(0, 4).map((cell, ci) => (
                        <td key={ci} className="cryptoblog-gdocs-cell">
                          <Text size={0}>
                            {(cell || " ").slice(0, 24)}
                            {(cell || "").length > 24 ? "…" : ""}
                          </Text>
                        </td>
                      ))}
                      {colCount > 4 ? (
                        <td className="cryptoblog-gdocs-cell">
                          <Text size={0} muted>
                            …
                          </Text>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rowCount > 4 ? (
                <Text size={0} muted>
                  ほか {rowCount - 4} 行…
                </Text>
              ) : null}
            </Box>
          ) : null}
        </Stack>
      </Card>

      {editorOpen ? (
        <DialogEscapeGuard>
          <Dialog
            id={`table-edit-${editorId}`}
            header="表を編集"
            width={2}
            zOffset={20000}
            onClose={closeEditor}
          >
            <Box padding={4}>
              <Stack space={4}>
                <Text size={1} muted>
                  スマホ優先：列は 3〜4 が目安。セルは短い語句（推奨 6 文字／最大 10）。左端列は公開時にスクロール固定されます。終わったら「完了」か ×。
                </Text>
                <TableEditor value={value} onChange={props.onChange} />
                <Flex justify="flex-end" gap={2}>
                  <Button
                    icon={TrashIcon}
                    text="表を削除"
                    tone="critical"
                    mode="ghost"
                    fontSize={1}
                    padding={3}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setConfirmDelete(true)}
                  />
                  <Button
                    text="完了"
                    tone="primary"
                    fontSize={1}
                    padding={3}
                    onClick={closeEditor}
                  />
                </Flex>
              </Stack>
            </Box>
          </Dialog>
        </DialogEscapeGuard>
      ) : null}

      {confirmDelete ? (
        <Dialog
          id={`table-delete-${editorId}`}
          header="表を削除"
          width={1}
          zOffset={21000}
          onClose={() => setConfirmDelete(false)}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1}>この表を本文から削除します。よろしいですか？</Text>
              <Flex justify="flex-end" gap={2}>
                <Button
                  text="キャンセル"
                  mode="ghost"
                  fontSize={1}
                  padding={3}
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                />
                <Button
                  icon={TrashIcon}
                  text="削除する"
                  tone="critical"
                  fontSize={1}
                  padding={3}
                  loading={deleting}
                  onClick={deleteTable}
                />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      ) : null}
    </>
  );
}

// モーダル（ダイアログ）で編集する装飾ブロック。
// これらの編集中は Escape でダイアログが閉じないようにする。
const MODAL_BLOCK_TYPES = new Set([
  "speechBubble",
  "titledFrame",
  "customButton",
  "accordionBlock",
  "qaBlock",
  // table は GdocsBlock でインライン化し、自前 Dialog のみ使う
]);

/**
 * 装飾ブロックの編集ダイアログ内で Escape がダイアログの「閉じる」動作へ
 * 伝播するのを止める。日本語 IME では変換候補を消すために Escape を押す
 * 癖があり、その Escape でダイアログごと閉じて本文に戻ってしまうため。
 * preventDefault はしないので、IME の変換キャンセル自体は妨げない。
 * 閉じたいときはダイアログ右上の×で閉じる。
 *
 * Dialog 本体は portal 側で capture するため、window の capture でも止める。
 */
function DialogEscapeGuard(props: { children: ReactNode }) {
  useEffect(() => {
    const stopEscape = (event: Event) => {
      const ke = event as unknown as { key?: string; stopPropagation: () => void };
      if (ke.key === "Escape" || ke.key === "Esc") {
        ke.stopPropagation();
      }
    };
    window.addEventListener("keydown", stopEscape, true);
    window.addEventListener("keyup", stopEscape, true);
    return () => {
      window.removeEventListener("keydown", stopEscape, true);
      window.removeEventListener("keyup", stopEscape, true);
    };
  }, []);

  const stopEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" || event.key === "Esc") {
      event.stopPropagation();
    }
  };

  return (
    <div onKeyDownCapture={stopEscape} onKeyUpCapture={stopEscape}>
      {props.children}
    </div>
  );
}

function isPortableTextSchema(schemaType: InputProps["schemaType"]) {
  if (schemaType.jsonType !== "array" || !Array.isArray(schemaType.of)) {
    return false;
  }

  return schemaType.of.some(
    (member) => "name" in member && member.name === "block",
  );
}

function GdocsStudioLayout(props: LayoutProps) {
  return (
    <div className="cryptoblog-gdocs-studio">
      {props.renderDefault(props)}
      <StudioPaneWidthResizer />
    </div>
  );
}

/**
 * 表ブロックは Sanity 標準の ObjectEditModal（popover/dialog）を使わない。
 * プレビュー位置に入力コンポーネント（要約カード＋自前 Dialog）を常駐させ、
 * 行・列編集のたびに modal が閉じて本文へ戻る問題を根絶する。
 * （Sanity 公式の image インライン編集と同パターン）
 */
function GdocsBlock(props: BlockProps) {
  const { schemaType, children, renderDefault, open, onClose } = props;

  // 挿入時などに member.open されてもすぐ閉じ、フォーム状態を戻す
  useEffect(() => {
    if (schemaType.name === "table" && open) {
      onClose();
    }
  }, [schemaType.name, open, onClose]);

  if (schemaType.name === "table") {
    return renderDefault({
      ...props,
      open: false,
      onOpen: () => {
        // no-op: 編集はプレビュー内カードの「表を編集」→ 自前 Dialog
      },
      renderPreview: () => (
        <div
          contentEditable={false}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      ),
    });
  }

  return renderDefault(props);
}

function GdocsFormInput(props: InputProps) {
  const { schemaType, renderDefault } = props;

  // ドキュメント直下のフィールドだけ Google Docs 風の装飾を当てる。
  // 装飾ブロック（titledFrame など）内のネストしたフィールドに同じ
  // ラッパーを当てると、本文専用エディタや余計なスタイルが誤適用され、
  // 「キャプション付きブロックに入力できない」等の不具合になるため。
  const isTopLevel = Array.isArray(props.path) && props.path.length === 1;

  if (schemaType.name === "table" && schemaType.jsonType === "object") {
    // DialogEscapeGuard は TableDialogInput 内で包む
    return <TableDialogInput {...props} />;
  }

  // 装飾ブロック本体（object）は Escape ガードで包み、入力中の Escape で
  // ダイアログが閉じて本文に戻る挙動を防ぐ。
  if (MODAL_BLOCK_TYPES.has(schemaType.name) && schemaType.jsonType === "object") {
    return <DialogEscapeGuard>{renderDefault(props)}</DialogEscapeGuard>;
  }

  // 装飾ブロック編集ダイアログ内のネスト入力も同様に Escape を止める
  // （Q&A 一覧の入れ子ダイアログで IME の Escape が「閉じる」になるのを防ぐ）。
  const pathDepth = Array.isArray(props.path) ? props.path.length : 0;
  if (pathDepth >= 2) {
    return <DialogEscapeGuard>{renderDefault(props)}</DialogEscapeGuard>;
  }

  // 以降のラッパーはトップレベル限定。ネストは Sanity 標準入力に任せる。
  if (!isTopLevel) {
    return renderDefault(props);
  }

  if (isPortableTextSchema(schemaType)) {
    if (schemaType.name === "body") {
      return <BodyBlockEditorInput {...props} />;
    }
    return <div className="cryptoblog-gdocs-pte-canvas">{renderDefault(props)}</div>;
  }

  if (schemaType.jsonType === "text") {
    return <div className="cryptoblog-gdocs-text-canvas">{renderDefault(props)}</div>;
  }

  if (
    schemaType.jsonType === "string" &&
    schemaType.name !== "slug" &&
    !("rows" in (schemaType.options ?? {}) && schemaType.options?.rows)
  ) {
    return <div className="cryptoblog-gdocs-string-canvas">{renderDefault(props)}</div>;
  }

  return renderDefault(props);
}

export const gdocsStudioPlugin = definePlugin({
  name: "cryptoblog-gdocs-studio",
  studio: {
    components: {
      layout: GdocsStudioLayout,
    },
  },
  form: {
    components: {
      input: GdocsFormInput,
      block: GdocsBlock,
    },
  },
});

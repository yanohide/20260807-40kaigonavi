"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const STORAGE_KEY = "cryptoblog.studio.sidePaneWidth";
const MIN = 160;
const MAX = 480;
const DEFAULT = 280;

function readStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return DEFAULT;
  return Math.min(MAX, Math.max(MIN, Math.round(n)));
}

function applySideWidth(width: number) {
  const value = `${width}px`;
  const root = document.querySelector(".cryptoblog-gdocs-studio");
  if (root instanceof HTMLElement) {
    root.style.setProperty("--cryptoblog-side-width", value);
  }
  document.documentElement.style.setProperty("--cryptoblog-side-width", value);
}

function isStudioDialogOpen(): boolean {
  return Boolean(
    document.querySelector(
      '[data-ui="DialogCard"], [role="dialog"][data-ui="Dialog"]',
    ),
  );
}

/**
 * Sanity 標準のペイン分割は一覧が幅ロックされほぼ動かないため、
 * 文書ペイン左端の自前ハンドルでサイド幅を変える。
 * 編集ダイアログ表示中は非表示にし、入力フォーカスを奪わない。
 */
export function StudioPaneWidthResizer() {
  const [width, setWidth] = useState(DEFAULT);
  const [left, setLeft] = useState<number | null>(null);
  const [top, setTop] = useState(0);
  const [height, setHeight] = useState(0);
  const [hiddenForDialog, setHiddenForDialog] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const lastPosRef = useRef({ left: null as number | null, top: 0, height: 0, hidden: false });

  useEffect(() => {
    const initial = readStoredWidth();
    setWidth(initial);
    applySideWidth(initial);
  }, []);

  useEffect(() => {
    applySideWidth(width);
  }, [width]);

  useEffect(() => {
    let raf = 0;
    let disposed = false;

    const update = () => {
      if (disposed) return;
      const dialogOpen = isStudioDialogOpen();
      if (dialogOpen) {
        if (!lastPosRef.current.hidden) {
          lastPosRef.current.hidden = true;
          setHiddenForDialog(true);
          setLeft(null);
        }
        return;
      }

      const docPane = document.querySelector<HTMLElement>(
        '[data-testid="document-pane"]',
      );
      if (!docPane) {
        if (lastPosRef.current.left !== null || lastPosRef.current.hidden) {
          lastPosRef.current = { left: null, top: 0, height: 0, hidden: false };
          setHiddenForDialog(false);
          setLeft(null);
        }
        return;
      }

      const rect = docPane.getBoundingClientRect();
      const nextLeft = Math.round(rect.left - 5);
      const nextTop = Math.round(rect.top);
      const nextHeight = Math.round(rect.height);
      const prev = lastPosRef.current;
      if (
        prev.hidden ||
        prev.left !== nextLeft ||
        prev.top !== nextTop ||
        prev.height !== nextHeight
      ) {
        lastPosRef.current = {
          left: nextLeft,
          top: nextTop,
          height: nextHeight,
          hidden: false,
        };
        setHiddenForDialog(false);
        setLeft(nextLeft);
        setTop(nextTop);
        setHeight(nextHeight);
      }
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    const ro = new ResizeObserver(schedule);
    const layout = document.querySelector("[data-ui='PaneLayout']");
    if (layout) ro.observe(layout);
    window.addEventListener("resize", schedule);

    // ダイアログ開閉だけ監視（本文入力の毎回 DOM 変更では動かさない）
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          schedule();
          return;
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [width]);

  const onPointerMove = useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const next = Math.min(
      MAX,
      Math.max(MIN, Math.round(drag.startWidth + (event.clientX - drag.startX))),
    );
    setWidth(next);
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    setWidth((current) => {
      window.localStorage.setItem(STORAGE_KEY, String(current));
      return current;
    });
  }, [onPointerMove]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragRef.current = { startX: event.clientX, startWidth: width };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [onPointerMove, onPointerUp, width],
  );

  if (hiddenForDialog || left === null || height < 40) return null;

  return (
    <div
      className="cryptoblog-pane-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label="サイドバーの幅を調整"
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={width}
      title="ドラッグして一覧の幅を変え、本文エリアを広げられます"
      onPointerDown={onPointerDown}
      style={{ left, top, height }}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SHOW_AFTER_PX = 200;

export function BackToTopButton() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  if (!mounted) return null;

  return createPortal(
    <button
      type="button"
      onClick={scrollToTop}
      className={`back-to-top${visible ? " back-to-top--visible" : ""}`}
      aria-label="トップに戻る"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <span className="back-to-top__icon" aria-hidden="true">
        ↑
      </span>
      <span className="back-to-top__label">トップに戻る</span>
    </button>,
    document.body,
  );
}

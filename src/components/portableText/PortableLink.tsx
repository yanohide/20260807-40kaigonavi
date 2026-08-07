import {
  Children,
  isValidElement,
  type ReactNode,
} from "react";

function containsAnchor(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (!isValidElement(child)) return false;
    if (child.type === "a" || child.type === PortableLink) return true;
    const kids = (child.props as { children?: ReactNode } | undefined)
      ?.children;
    return kids != null && containsAnchor(kids);
  });
}

/**
 * PortableText の link mark。
 * WP/MD 由来で link が入れ子になると <a><a> になり hydration が壊れるため、
 * 子に既に <a> / PortableLink がある場合は外側を描画しない。
 * （Server Component のまま動かす。use client は使わない）
 */
export function PortableLink({
  children,
  value,
}: {
  children?: ReactNode;
  value?: { href?: string };
}) {
  if (containsAnchor(children)) {
    return <>{children}</>;
  }
  const href = String(value?.href || "");
  return (
    <a
      href={href || undefined}
      className="text-[var(--color-link)] underline underline-offset-[3px]"
      rel="noopener noreferrer"
      target={href.startsWith("/") ? undefined : "_blank"}
    >
      {children}
    </a>
  );
}

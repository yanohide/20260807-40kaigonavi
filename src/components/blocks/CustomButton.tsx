export type CustomButtonColor =
  | "burgundy"
  | "red"
  | "gold"
  | "navy"
  | "blue"
  | "green"
  | "outline";

export type CustomButtonValue = {
  /** ボタン上部のマイクロコピー（＼ ／ で挟んで表示） */
  eyebrow?: string;
  text?: string;
  url?: string;
  color?: CustomButtonColor;
  /** true = 光るタイプ / false・未設定 = 光らないタイプ */
  glow?: boolean;
  newTab?: boolean;
};

/** 表示用に ＼ … ／ 形式へ正規化 */
export function formatEyebrow(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const inner = raw
    .trim()
    .replace(/^[＼\\]\s*/, "")
    .replace(/\s*[／/]$/, "")
    .trim();
  if (!inner) return null;
  return `＼ ${inner} ／`;
}

const COLOR_MAP: Record<CustomButtonColor, string> = {
  burgundy: "bg-[#6b2d3c] hover:bg-[#4a1f2a]",
  /** クリーム／トープ基調に対する拮抗アクセント（アフィCTA既定） */
  red: "bg-[#e53935] hover:bg-[#c62828]",
  gold: "bg-[#d4a84b] hover:bg-[#c09840]",
  navy: "bg-[#2c3e6b] hover:bg-[#1f2d4f]",
  blue: "bg-[#1e88e5] hover:bg-[#1565c0]",
  green: "bg-[#43a047] hover:bg-[#2e7d32]",
  outline:
    "border-2 border-[#2c3e6b] bg-transparent text-[#2c3e6b] hover:bg-[#eef2f8]",
};

const GLOW_SHADOW: Record<CustomButtonColor, string> = {
  burgundy:
    "0 0 0 1px rgba(107,45,60,0.3), 0 8px 22px rgba(107,45,60,0.35), 0 0 28px rgba(107,45,60,0.45)",
  red: "0 0 0 1px rgba(229,57,53,0.35), 0 8px 24px rgba(229,57,53,0.4), 0 0 34px rgba(255,80,70,0.55)",
  gold: "0 0 0 1px rgba(212,168,75,0.35), 0 8px 22px rgba(212,168,75,0.4), 0 0 32px rgba(255,210,120,0.5)",
  navy: "0 0 0 1px rgba(44,62,107,0.3), 0 8px 22px rgba(44,62,107,0.35), 0 0 28px rgba(74,110,180,0.4)",
  blue: "0 0 0 1px rgba(30,136,229,0.3), 0 8px 22px rgba(30,136,229,0.4), 0 0 30px rgba(30,136,229,0.45)",
  green:
    "0 0 0 1px rgba(67,160,71,0.3), 0 8px 22px rgba(67,160,71,0.35), 0 0 28px rgba(67,160,71,0.45)",
  outline:
    "0 0 0 1px rgba(44,62,107,0.2), 0 6px 18px rgba(44,62,107,0.28), 0 0 24px rgba(74,110,180,0.25)",
};

export function CustomButton({ value }: { value?: CustomButtonValue }) {
  const {
    eyebrow,
    text,
    url,
    color = "red",
    glow = true,
    newTab = true,
  } = value ?? {};
  if (!text || !url) return null;

  const tone = COLOR_MAP[color] ?? COLOR_MAP.navy;
  const isExternal = /^https?:\/\//.test(url);
  const openNewTab = newTab && isExternal;
  const isOutline = color === "outline";
  const eyebrowLabel = formatEyebrow(eyebrow);

  return (
    <div className="my-8 flex flex-col items-center gap-2 not-prose">
      {eyebrowLabel ? (
        <p className="m-0 text-center text-[0.95rem] font-bold tracking-[0.08em] text-[var(--color-ink)]">
          {eyebrowLabel}
        </p>
      ) : null}
      <a
        href={url}
        target={openNewTab ? "_blank" : undefined}
        rel={openNewTab ? "noopener noreferrer" : undefined}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-9 py-3.5 text-base font-bold tracking-[0.08em] no-underline transition-[box-shadow,transform,background-color,filter] duration-300 ${tone} ${
          glow ? "cryptoblog-btn-glow hover:-translate-y-0.5" : "hover:-translate-y-0.5"
        }`}
        style={{
          ...(isOutline ? {} : { color: "#ffffff" }),
          ...(glow ? { boxShadow: GLOW_SHADOW[color] ?? GLOW_SHADOW.red } : {}),
        }}
      >
        <span>{text}</span>
        {openNewTab ? (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 5h5v5m0-5L10 14M9 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"
            />
          </svg>
        ) : null}
      </a>
    </div>
  );
}

type Sparkle = {
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  kind: "dot" | "star";
};

/** SSR/CSR で一致するよう固定配置（Math.random 禁止） */
const HEADER_SPARKLES: Sparkle[] = [
  { top: "12%", left: "6%", size: 3, delay: "0s", duration: "2.8s", kind: "dot" },
  { top: "28%", left: "14%", size: 8, delay: "0.4s", duration: "3.4s", kind: "star" },
  { top: "18%", left: "22%", size: 2, delay: "1.1s", duration: "2.4s", kind: "dot" },
  { top: "42%", left: "31%", size: 6, delay: "0.2s", duration: "3.1s", kind: "star" },
  { top: "15%", left: "48%", size: 3, delay: "1.6s", duration: "2.6s", kind: "dot" },
  { top: "55%", left: "58%", size: 7, delay: "0.8s", duration: "3.6s", kind: "star" },
  { top: "22%", left: "68%", size: 2, delay: "2.1s", duration: "2.2s", kind: "dot" },
  { top: "38%", left: "78%", size: 9, delay: "0.5s", duration: "3.2s", kind: "star" },
  { top: "12%", left: "88%", size: 3, delay: "1.3s", duration: "2.9s", kind: "dot" },
  { top: "62%", left: "92%", size: 5, delay: "1.9s", duration: "3.5s", kind: "star" },
  { top: "70%", left: "8%", size: 2, delay: "0.7s", duration: "2.5s", kind: "dot" },
  { top: "8%", left: "38%", size: 6, delay: "2.4s", duration: "3.0s", kind: "star" },
];

const HERO_SPARKLES: Sparkle[] = [
  { top: "10%", left: "5%", size: 4, delay: "0s", duration: "2.4s", kind: "dot" },
  { top: "22%", left: "12%", size: 12, delay: "0.3s", duration: "3.2s", kind: "star" },
  { top: "8%", left: "20%", size: 3, delay: "1.2s", duration: "2.6s", kind: "dot" },
  { top: "35%", left: "7%", size: 9, delay: "0.7s", duration: "3.5s", kind: "star" },
  { top: "18%", left: "26%", size: 5, delay: "1.8s", duration: "2.8s", kind: "dot" },
  { top: "52%", left: "15%", size: 11, delay: "0.4s", duration: "3.8s", kind: "star" },
  { top: "6%", left: "34%", size: 4, delay: "2.2s", duration: "2.5s", kind: "dot" },
  { top: "28%", left: "38%", size: 8, delay: "0.9s", duration: "3.1s", kind: "star" },
  { top: "62%", left: "28%", size: 3, delay: "1.5s", duration: "2.3s", kind: "dot" },
  { top: "14%", left: "46%", size: 10, delay: "0.2s", duration: "3.6s", kind: "star" },
  { top: "44%", left: "52%", size: 4, delay: "2.0s", duration: "2.9s", kind: "dot" },
  { top: "24%", left: "58%", size: 7, delay: "1.0s", duration: "3.3s", kind: "star" },
  { top: "58%", left: "64%", size: 3, delay: "0.6s", duration: "2.7s", kind: "dot" },
  { top: "12%", left: "70%", size: 9, delay: "1.4s", duration: "3.4s", kind: "star" },
  { top: "38%", left: "76%", size: 4, delay: "2.4s", duration: "2.6s", kind: "dot" },
  { top: "20%", left: "82%", size: 11, delay: "0.5s", duration: "3.7s", kind: "star" },
  { top: "50%", left: "88%", size: 3, delay: "1.7s", duration: "2.4s", kind: "dot" },
  { top: "32%", left: "93%", size: 8, delay: "0.8s", duration: "3.0s", kind: "star" },
  { top: "72%", left: "42%", size: 5, delay: "1.1s", duration: "3.2s", kind: "star" },
  { top: "68%", left: "72%", size: 6, delay: "1.9s", duration: "2.8s", kind: "star" },
  { top: "78%", left: "18%", size: 4, delay: "2.6s", duration: "3.1s", kind: "dot" },
  { top: "4%", left: "56%", size: 6, delay: "2.8s", duration: "2.5s", kind: "star" },
];

export function SparkleField({
  variant = "hero",
}: {
  variant?: "header" | "hero";
}) {
  const items = variant === "header" ? HEADER_SPARKLES : HERO_SPARKLES;

  return (
    <div
      className={`sparkle-field sparkle-field--${variant}`}
      aria-hidden="true"
    >
      {items.map((s, i) => (
        <span
          key={`${variant}-${i}`}
          className={`sparkle sparkle--${s.kind}`}
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}

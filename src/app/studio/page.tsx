import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Studio（記事編集）",
  robots: { index: false, follow: false },
};

/** 本番 Worker サイズ制限のため Sanity Studio は載せない。編集手順だけ表示。 */
export default function StudioInfoPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">記事の編集（Studio）</h1>
      <p className="mt-4 text-[var(--color-muted)]">
        この公開サイトには編集画面を載せていません。記事データは Sanity
        に保存されています。
      </p>
      <ol className="mt-6 list-decimal space-y-2 pl-5">
        <li>PC でプロジェクトフォルダを Cursor で開く</li>
        <li>
          ターミナルで{" "}
          <code className="rounded bg-[var(--color-surface)] px-1">
            npm run studio
          </code>{" "}
          を実行
        </li>
        <li>
          ブラウザで{" "}
          <a
            href="http://localhost:3333"
            className="text-[var(--color-link)] underline"
          >
            http://localhost:3333
          </a>{" "}
          を開く
        </li>
        <li>記事を編集して Publish（本番サイトに反映）</li>
      </ol>
      <p className="mt-8">
        <Link href="/" className="text-[var(--color-link)] underline">
          ← サイトトップへ
        </Link>
      </p>
    </main>
  );
}

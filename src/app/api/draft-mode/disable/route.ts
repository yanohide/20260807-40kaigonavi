import { draftMode } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 下書きプレビューを終了して通常表示に戻す。
 * redirect() ヘルパーだと Cookie 削除が落ちることがあるため、
 * NextResponse.redirect で確実に Set-Cookie を返す。
 * 戻り先は同じ記事（redirect クエリ）にして、見た目の差が分かりやすくする。
 */
export async function GET(request: NextRequest) {
  const draft = await draftMode();
  draft.disable();

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("redirect") || searchParams.get("slug");
  const destination = resolveDestination(raw);

  try {
    revalidatePath(destination);
  } catch {
    // パス再検証に失敗しても Cookie 削除は続行
  }

  const response = NextResponse.redirect(new URL(destination, request.url), {
    status: 307,
  });
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

function resolveDestination(raw: string | null): string {
  if (!raw) return "/posts";

  // slug だけ渡された場合
  if (!raw.startsWith("/")) {
    return `/posts/${encodeURIComponent(raw)}`;
  }

  // オープンリダイレクト防止：同一オリジンの相対パスのみ
  if (raw.startsWith("//") || raw.includes("://")) return "/posts";
  if (raw.startsWith("/api/")) return "/posts";

  return raw;
}

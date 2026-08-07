import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 下書きプレビューを有効化する。
 * Studio の「プレビューを見る」から
 *   /api/draft-mode/enable?secret=...&slug=...
 * の形で呼ばれ、合言葉が一致したら Draft Mode を ON にして記事ページへ飛ぶ。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");

  const expected = process.env.SANITY_PREVIEW_SECRET;

  if (!expected) {
    return new Response(
      "SANITY_PREVIEW_SECRET が未設定です。.env.local に設定してください。",
      { status: 500 },
    );
  }

  if (secret !== expected) {
    return new Response("プレビュー用の合言葉が正しくありません。", {
      status: 401,
    });
  }

  const draft = await draftMode();
  draft.enable();

  const destination = slug ? `/posts/${encodeURIComponent(slug)}` : "/posts";
  const response = NextResponse.redirect(new URL(destination, request.url), {
    status: 307,
  });
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

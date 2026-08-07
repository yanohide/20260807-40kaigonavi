/** 記事末尾・サイドバー共通の運営者プロフィール */

export const OPERATOR_PROFILE_NAME = "矢野英人｜ヤノヒデ";

/** サイドバー・吹き出し・運営者枠共通のアイコン */
export const OPERATOR_AVATAR = "/avatars/yanohide.jpg";

export const LEGACY_OPERATOR_SPEAKERS = [
  "ヤノヒデ",
  "矢野英人",
  "ヒデ",
  "yanohide",
] as const;

export function isOperatorSpeechSpeaker(
  speaker?: string | null,
  position?: "left" | "right",
): boolean {
  const s = String(speaker || "").trim();
  if (s === "質問者" || s === "悩む人" || s === "案内") return false;
  if (s === OPERATOR_PROFILE_NAME) return true;
  if (
    LEGACY_OPERATOR_SPEAKERS.some(
      (name) => name.toLowerCase() === s.toLowerCase(),
    )
  ) {
    return true;
  }
  return position === "right";
}

export function operatorSpeechDisplayName(
  speaker?: string | null,
  position?: "left" | "right",
): string {
  if (isOperatorSpeechSpeaker(speaker, position)) return OPERATOR_PROFILE_NAME;
  const s = String(speaker || "").trim();
  return s || "質問者";
}

export const OPERATOR_PROFILE_LINES = [
  "本業： アラフィフ介護職員（歴18年）",
  "資格： FP2級×ケアマネ",
  "家族： アラフォー2児のパパ",
  "ミッション： 40代からの介護・老後の不安を、わかりやすく具体的に解説します。",
] as const;

/** articles/*.md の :::titled-box 運営者枠（全記事共通） */
export const OPERATOR_TITLED_BOX_MARKDOWN = `:::titled-box
title: サイト運営者の情報
style: band
avatar: yanohide
avatarCaption: ${OPERATOR_PROFILE_NAME}

${OPERATOR_PROFILE_LINES.map((line) => `- ${line}`).join("\n")}
:::`;

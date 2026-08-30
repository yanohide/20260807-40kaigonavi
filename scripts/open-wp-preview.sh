#!/bin/bash
# 旧 WordPress（Xserver）だけを表示する確認用 Chrome を起動する。
# /etc/hosts は書き換えず、この Chrome プロセス内だけで名前解決を差し替える。
# Xserver 側の IP が変わったら OLD_WP_IP=x.x.x.x npm run wp:preview で上書きできる。
#
# 使い方:
#   npm run wp:preview   … トップページを開く
#   npm run wp:admin     … ログイン画面を開く（投稿編集用）
set -euo pipefail

OLD_WP_IP="${OLD_WP_IP:-183.181.88.25}"
PROFILE_DIR="${HOME}/.chrome-wp-preview"
CHROME_APP="/Applications/Google Chrome.app"
START_URL="${1:-https://sonocafe.xyz/}"

if [ ! -d "$CHROME_APP" ]; then
  echo "Google Chrome が見つかりません: $CHROME_APP" >&2
  exit 1
fi

if grep -q "sonocafe\.xyz" /etc/hosts 2>/dev/null; then
  echo "警告: /etc/hosts に sonocafe.xyz の行が残っています。" >&2
  echo "      普段のブラウザも旧サーバーを見てしまうため、先に削除してください:" >&2
  echo "      sudo sed -i '' '/sonocafe\\.xyz/d' /etc/hosts" >&2
fi

mkdir -p "$PROFILE_DIR"

open -na "$CHROME_APP" --args \
  --user-data-dir="$PROFILE_DIR" \
  --host-resolver-rules="MAP sonocafe.xyz ${OLD_WP_IP},MAP www.sonocafe.xyz ${OLD_WP_IP}" \
  --no-first-run \
  --no-default-browser-check \
  "$START_URL"

echo ""
echo "旧 WordPress 用 Chrome を起動しました（接続先: ${OLD_WP_IP}）"
echo ""
echo "【重要】404 になるときは、普段使いの Chrome/Safari で開いている可能性があります。"
echo "       今回 npm run で開いた「別ウィンドウ」で操作してください。"
echo ""
echo "【見分け方】"
echo "  - 旧 WordPress … 見守り記事が【2025年版】、ログイン画面が表示される"
echo "  - 新サイト     … 見守り記事が【2026年版】、wp-admin は 404"
echo ""
echo "【管理画面】 npm run wp:admin"
echo "             または https://sonocafe.xyz/wp-login.php"

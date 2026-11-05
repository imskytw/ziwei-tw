#!/bin/zsh -l
# Mac：雙擊這個檔案就能啟動（第一次會自動安裝並詢問要接哪個 AI）
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "⚠️ 這台 Mac 還沒有安裝 Node.js。"
  echo "   請到 https://nodejs.org 下載「LTS」版本安裝，裝好後再雙擊一次這個檔案。"
  echo ""
  open "https://nodejs.org/zh-tw/download"
  read -k 1 "?按任意鍵關閉…"
  exit 1
fi
node scripts/launch.mjs

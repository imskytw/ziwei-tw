#!/bin/zsh -l
# Mac：雙擊這個檔案可以重新選擇要串接的 AI、更換金鑰
cd "$(dirname "$0")" || exit 1
node scripts/setup.mjs
read -k 1 "?按任意鍵關閉…"

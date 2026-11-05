#!/bin/bash
# 紫微斗數（繁體版）Mac 一行安裝：
#   curl -fsSL https://raw.githubusercontent.com/imskytw/ziwei-tw/main/install.sh | bash
# 會做的事：檢查／安裝 Node.js → 下載專案到「家目錄/ziwei-tw」→ 啟動（第一次會問你要接哪個 AI）
set -e
REPO="imskytw/ziwei-tw"
DEST="$HOME/ziwei-tw"
say() { printf '\n\033[1m%s\033[0m\n' "$1"; }

need_node() {
  command -v node >/dev/null 2>&1 || return 0
  node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=15)?1:0)' && return 0 || return 1
}

if need_node; then
  say "需要安裝 Node.js（22.15 以上）。"
  if [ "$(uname)" = "Darwin" ]; then
    VER=$(curl -fsSL https://nodejs.org/dist/index.json | /usr/bin/python3 -c 'import json,sys;print(next(r["version"] for r in json.load(sys.stdin) if r["lts"]))')
    PKG="/tmp/node-$VER.pkg"
    say "下載 Node.js $VER（官方安裝檔）…"
    curl -fL --progress-bar -o "$PKG" "https://nodejs.org/dist/$VER/node-$VER.pkg"
    say "安裝 Node.js：接下來會要求輸入這台 Mac 的開機密碼（輸入時畫面不會顯示，是正常的）。"
    sudo installer -pkg "$PKG" -target /
    export PATH="/usr/local/bin:$PATH"
  else
    echo "請先到 https://nodejs.org/zh-tw/download 安裝 LTS 版，再重新執行這個指令。"; exit 1
  fi
fi
say "Node.js 版本：$(node -v)"

say "下載專案到 $DEST …"
TMP=$(mktemp -d)
curl -fL --progress-bar -o "$TMP/src.zip" "https://github.com/$REPO/archive/refs/heads/main.zip"
unzip -q "$TMP/src.zip" -d "$TMP"
SRC=$(find "$TMP" -maxdepth 1 -type d -name 'ziwei-tw-*' | head -1)
mkdir -p "$DEST"
# 更新時保留你的設定檔與已下載的斷語庫
for keep in .env.local data node_modules; do [ -e "$DEST/$keep" ] && mv "$DEST/$keep" "$TMP/keep-$keep"; done
rm -rf "$DEST"; mv "$SRC" "$DEST"
for keep in .env.local data node_modules; do [ -e "$TMP/keep-$keep" ] && mv "$TMP/keep-$keep" "$DEST/$keep"; done
rm -rf "$TMP"
chmod +x "$DEST"/*.command 2>/dev/null || true
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true

say "完成！之後要使用，雙擊「$DEST/啟動紫微斗數.command」就好。現在幫你啟動："
cd "$DEST" && exec node scripts/launch.mjs

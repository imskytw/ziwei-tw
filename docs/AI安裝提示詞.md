# 讓 AI 幫你安裝：複製下面整段，貼給 AI

適用於能操作你電腦的 AI 助理，例如 **Claude 桌面版**（開啟「電腦使用」或連結電腦）、**ChatGPT 的 Codex**、**Cursor**、**Claude Code**。
一般網頁版的聊天機器人不能操作你的電腦，請改用 README 裡的「一行安裝指令」。

---

```text
請幫我在這台電腦上安裝並啟動「紫微斗數繁體開源版」，專案在 https://github.com/imskytw/ziwei-tw 。請依序完成，每一步做完簡短告訴我結果：

1. 檢查 Node.js 版本（node -v）。需要 22.15 以上；沒有或太舊就幫我安裝 LTS 版：
   - Mac：從 nodejs.org 下載官方 .pkg 安裝檔安裝（需要我輸入開機密碼時請提醒我自己輸入）
   - Windows：用 winget install OpenJS.NodeJS.LTS
2. 把專案下載到我的使用者資料夾裡的 ziwei-tw 資料夾（用 git clone 或下載 main 分支的 ZIP 解壓縮都可以）。如果資料夾已經存在，保留裡面的 .env.local 和 data 資料夾。
3. 在專案資料夾執行 npm install。
4. 啟動網站：Mac 開啟「啟動紫微斗數.command」，Windows 開啟「啟動紫微斗數.bat」；或在終端機執行 node scripts/launch.mjs。
   第一次啟動會出現「AI 設定精靈」，問我要接哪一家 AI 並要我貼金鑰。
   ⚠️ 請停下來讓我自己在終端機回答，不要代替我輸入或讀取任何 API 金鑰。我不想用 AI 的話會直接按 Enter 跳過。
5. 等終端機出現「Ready」和網址（通常是 http://localhost:3456，被佔用時會自動換成 3457 等），幫我用瀏覽器打開，確認首頁有顯示「排出你的紫微命盤」。
6. 最後告訴我：之後要怎麼再次開啟（雙擊哪個檔案），以及要怎麼更換 AI（執行「設定AI」）。

注意：使用期間終端機視窗要保持開著，關掉網站就會停止。
```

---

## 常見狀況

- **AI 說它不能操作電腦**：代表你用的版本沒有電腦操作權限。改用 README 裡的一行安裝指令，自己貼到終端機（Mac）或 PowerShell（Windows）。
- **AI 想幫你填金鑰**：請拒絕，自己在終端機貼上。金鑰等同密碼，只存在你電腦的 `.env.local` 檔案裡。

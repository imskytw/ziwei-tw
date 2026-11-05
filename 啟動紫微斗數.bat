@echo off
chcp 65001 >nul
REM Windows：雙擊這個檔案就能啟動（第一次會自動安裝並詢問要接哪個 AI）
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo 這台電腦還沒有安裝 Node.js。請到 https://nodejs.org 下載 LTS 版本安裝後，再雙擊一次這個檔案。
  start "" "https://nodejs.org/zh-tw/download"
  pause
  exit /b 1
)
node scripts\launch.mjs
pause

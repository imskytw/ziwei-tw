@echo off
chcp 65001 >nul
REM Windows：雙擊這個檔案可以重新選擇要串接的 AI、更換金鑰
cd /d "%~dp0"
node scripts\setup.mjs
pause

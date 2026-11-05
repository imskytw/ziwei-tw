# 紫微斗數（繁體版）Windows 一行安裝（在 PowerShell 貼上）：
#   irm https://raw.githubusercontent.com/imskytw/ziwei-tw/main/install.ps1 | iex
# 會做的事：檢查／安裝 Node.js → 下載專案到「使用者資料夾\ziwei-tw」→ 建立桌面捷徑 → 啟動
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Repo = 'imskytw/ziwei-tw'
$Dest = Join-Path $HOME 'ziwei-tw'
function Say($m) { Write-Host "`n$m" -ForegroundColor Yellow }

function Test-Node {
  try { $v = (node -v) -replace 'v',''; $p = $v.Split('.'); return ([int]$p[0] -gt 22) -or ([int]$p[0] -eq 22 -and [int]$p[1] -ge 15) } catch { return $false }
}

if (-not (Test-Node)) {
  Say '需要安裝 Node.js（22.15 以上），使用 Windows 內建的 winget 安裝…'
  winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
  $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
  if (-not (Test-Node)) { Say '自動安裝沒有成功，請到 https://nodejs.org/zh-tw/download 下載 LTS 版安裝後，再貼一次這個指令。'; Start-Process 'https://nodejs.org/zh-tw/download'; return }
}
Say "Node.js 版本：$(node -v)"

Say "下載專案到 $Dest …"
$Tmp = Join-Path $env:TEMP ("ziwei-" + [guid]::NewGuid())
New-Item -ItemType Directory $Tmp | Out-Null
Invoke-WebRequest "https://github.com/$Repo/archive/refs/heads/main.zip" -OutFile "$Tmp\src.zip"
Expand-Archive "$Tmp\src.zip" -DestinationPath $Tmp
$Src = Get-ChildItem $Tmp -Directory | Where-Object Name -like 'ziwei-tw-*' | Select-Object -First 1
# 更新時保留設定檔與已下載的斷語庫
foreach ($k in '.env.local','data','node_modules') { if (Test-Path "$Dest\$k") { Move-Item "$Dest\$k" "$Tmp\keep-$k" } }
if (Test-Path $Dest) { Remove-Item $Dest -Recurse -Force }
Move-Item $Src.FullName $Dest
foreach ($k in '.env.local','data','node_modules') { if (Test-Path "$Tmp\keep-$k") { Move-Item "$Tmp\keep-$k" "$Dest\$k" } }
Remove-Item $Tmp -Recurse -Force

# 桌面捷徑
$Desk = [Environment]::GetFolderPath('Desktop')
$Ws = New-Object -ComObject WScript.Shell
$Lnk = $Ws.CreateShortcut("$Desk\紫微斗數.lnk")
$Lnk.TargetPath = "$Dest\啟動紫微斗數.bat"; $Lnk.WorkingDirectory = $Dest; $Lnk.Save()

Say '完成！之後要使用，雙擊桌面上的「紫微斗數」捷徑就好。現在幫你啟動：'
Set-Location $Dest
node scripts\launch.mjs

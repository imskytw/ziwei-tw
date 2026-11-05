#!/usr/bin/env node
/**
 * 一鍵啟動：檢查 Node 版本 → 必要時安裝套件 → 第一次啟動跑設定精靈 → 找空的埠 → 啟動並開瀏覽器
 * 由「啟動紫微斗數.command」（Mac）與「啟動紫微斗數.bat」（Windows）呼叫。
 */
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 15)) {
  console.log(`\n⚠️ 你的 Node.js 版本是 ${process.versions.node}，需要 22.15 以上（建議裝最新的 LTS 版）。\n   請到 https://nodejs.org/zh-tw/download 下載安裝後再試。\n`);
  process.exit(1);
}

const run = (args) => spawnSync(npm, args, { stdio: 'inherit', shell: isWin });

// 第一次啟動，或更新後 package-lock.json 有變動，就（重新）安裝套件
const lockFile = path.join(root, 'package-lock.json');
const stamp = path.join(root, 'node_modules', '.ziwei-lock-hash');
const lockHash = fs.existsSync(lockFile) ? crypto.createHash('sha1').update(fs.readFileSync(lockFile)).digest('hex') : '';
const installed = fs.existsSync(path.join(root, 'node_modules', 'next'));
const upToDate = installed && fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8').trim() === lockHash;
if (!upToDate) {
  console.log(installed ? '\n偵測到新版本，正在更新套件…\n' : '\n第一次啟動，正在安裝需要的套件（約 1–3 分鐘）…\n');
  if (run(['install', '--no-audit', '--no-fund']).status !== 0) {
    console.log('\n⚠️ 套件安裝失敗，請確認網路連線後再試一次。\n');
    process.exit(1);
  }
  try { fs.writeFileSync(stamp, lockHash); } catch {}
}

if (!fs.existsSync(path.join(root, '.env.local'))) {
  spawnSync(process.execPath, [path.join(root, 'scripts', 'setup.mjs')], { stdio: 'inherit' });
}

const free = (port) => new Promise(res => {
  const s = net.createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true)));
  s.listen(port, '0.0.0.0');
});
let port = Number(process.env.PORT) || 3456;
while (!(await free(port))) port++;

const url = `http://localhost:${port}`;
console.log(`\n${'─'.repeat(46)}\n  紫微斗數啟動中… 網址：${url}\n  ⚠️ 使用期間請不要關閉這個視窗；要停止就關掉它（或按 Ctrl+C）。\n${'─'.repeat(46)}\n`);

const child = spawn(npm, ['run', 'dev', '--', '-p', String(port)], { stdio: ['inherit', 'pipe', 'inherit'], shell: isWin });
let opened = false;
child.stdout.on('data', (buf) => {
  process.stdout.write(buf);
  if (!opened && /Ready|ready in|Local:/i.test(buf.toString())) {
    opened = true;
    setTimeout(() => {
      const opener = isWin ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
      spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref();
    }, 1500);
  }
});
child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));

#!/usr/bin/env node
/**
 * AI 設定精靈：用問答的方式產生 .env.local
 * 執行：npm run setup（或雙擊「設定AI」）
 * 只用 Node 內建模組，不需要額外安裝。
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.local');

const PROVIDERS = [
  { id: 'openai',    name: 'ChatGPT（OpenAI）',   keyEnv: 'OPENAI_API_KEY',    model: 'gpt-6.1-sol',       keyUrl: 'https://platform.openai.com/api-keys', hint: 'sk- 開頭' },
  { id: 'anthropic', name: 'Claude（Anthropic）',  keyEnv: 'ANTHROPIC_API_KEY', model: 'claude-sonnet-5-5', keyUrl: 'https://console.anthropic.com/settings/keys', hint: 'sk-ant- 開頭' },
  { id: 'gemini',    name: 'Gemini（Google）',     keyEnv: 'GEMINI_API_KEY',    model: 'gemini-3.8-flash',  keyUrl: 'https://aistudio.google.com/apikey', hint: 'AIza 開頭' },
  { id: 'deepseek',  name: 'DeepSeek',             keyEnv: 'DEEPSEEK_API_KEY',  model: 'deepseek-chat',     keyUrl: 'https://platform.deepseek.com/api_keys', hint: 'sk- 開頭' },
  { id: 'ollama',    name: 'Ollama 本機模型（免費、不用金鑰，需先安裝 Ollama）', keyEnv: null, model: 'qwen3', keyUrl: 'https://ollama.com/download' },
  { id: 'custom',    name: '其他 OpenAI 相容服務（自行填網址）', keyEnv: 'CUSTOM_API_KEY', model: '', keyUrl: '' },
];

// 讀取舊設定（保留使用者自己加的其他變數）
function readEnv() {
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let muted = false;
const origWrite = rl._writeToOutput?.bind(rl);
if (origWrite) rl._writeToOutput = (s) => { if (!muted) origWrite(s); else if (s.includes('\n')) origWrite('\n'); else origWrite('•'); };
const lines = rl[Symbol.asyncIterator]();
const ask = async (q) => { if (q) process.stdout.write(q); const r = await lines.next(); return r.done ? '' : String(r.value).trim(); };
const askSecret = async (q) => { process.stdout.write(q); muted = true; const a = await ask(''); muted = false; return a; };

const line = '─'.repeat(46);
console.log(`\n${line}\n  紫微斗數 · AI 設定精靈\n${line}`);
console.log('排盤本身不需要 AI；這裡設定的是「AI 解讀」要串哪一家。\n之後想換，再執行一次就好（npm run setup 或雙擊「設定AI」）。\n');

const env = readEnv();
const current = env.AI_PROVIDER;
PROVIDERS.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}${p.id === current ? '  ← 目前使用' : ''}`));
let idx;
while (true) {
  const a = await ask(`\n請輸入編號 1–${PROVIDERS.length}（直接按 Enter 跳過 AI 設定）：`);
  if (a === '') { idx = -1; break; }
  const n = Number(a);
  if (Number.isInteger(n) && n >= 1 && n <= PROVIDERS.length) { idx = n - 1; break; }
  console.log('  請輸入清單裡的數字。');
}

if (idx >= 0) {
  const p = PROVIDERS[idx];
  env.AI_PROVIDER = p.id;
  delete env.AI_MODEL; delete env.AI_BASE_URL;

  if (p.id === 'custom') {
    env.AI_BASE_URL = await ask('服務網址（例如 https://api.example.com/v1）：');
    env.AI_MODEL = await ask('模型名稱：');
  }
  if (p.keyEnv) {
    const has = env[p.keyEnv] && !/^your-/.test(env[p.keyEnv]);
    if (p.keyUrl) console.log(`\n金鑰申請網址：${p.keyUrl}${p.hint ? `（${p.hint}）` : ''}`);
    const key = await askSecret(`請貼上 ${p.name} 的金鑰${has ? '（直接按 Enter 沿用舊的）' : ''}：`);
    if (key) env[p.keyEnv] = key;
    else if (!has && p.id !== 'custom') console.log('  ⚠️ 沒有填金鑰，AI 解讀會提示你補上。');
  } else {
    console.log(`\n請先安裝 Ollama：${p.keyUrl}\n安裝後在終端機執行：ollama pull ${p.model}`);
  }
  if (p.model) {
    const m = await ask(`模型名稱（直接按 Enter 用預設 ${p.model}）：`);
    if (m) env.AI_MODEL = m;
  }
}

const name = await ask(`\n網站名稱（直接按 Enter 用「${env.NEXT_PUBLIC_SITE_NAME || '紫微命盤'}」）：`);
if (name) env.NEXT_PUBLIC_SITE_NAME = name;

// 寫檔：固定欄位在前、其餘保留
const order = ['AI_PROVIDER', 'AI_MODEL', 'AI_BASE_URL', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'DEEPSEEK_API_KEY', 'CUSTOM_API_KEY', 'NEXT_PUBLIC_SITE_NAME', 'NEXT_PUBLIC_SITE_URL'];
const keys = [...order.filter(k => env[k] !== undefined && env[k] !== ''), ...Object.keys(env).filter(k => !order.includes(k) && env[k] !== '')];
const body = ['# 由設定精靈產生（npm run setup）。這個檔案含有金鑰，請勿上傳或分享。', ...keys.map(k => `${k}=${env[k]}`), ''].join('\n');
fs.writeFileSync(envPath, body, { mode: 0o600 });

console.log(`\n✓ 已儲存設定到 .env.local`);
if (idx >= 0) console.log(`  AI：${PROVIDERS[idx].name}${env.AI_MODEL ? `，模型 ${env.AI_MODEL}` : ''}`);
console.log('  如果網站正在執行，請關掉終端機視窗後重新啟動，新設定才會生效。\n');
rl.close();

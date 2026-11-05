import 'server-only';
/**
 * 紫微斗數開源解讀數據集 v4.0（CC BY 4.0）—— 本機查表
 *
 * 來源：https://github.com/Renhuai123/ziwei-doushu/releases/tag/v4.0-13d（作者：王多魚AI）
 * 674,976 張命盤（國曆 1950–2026 每一天 × 12 時辰 × 男女）× 13 面向解讀，由排盤引擎 + 斷語庫確定性產生，不經 AI。
 *
 * 做法：
 *  1. 使用者排到哪一年，才下載那一年的 year-YYYY.jsonl.zst（約 2 MB），並用內建的官方 SHA-256 驗證
 *  2. 串流解壓（Node 內建 zstd）逐行找這張盤，找到就停
 *  3. 轉成繁體（台灣用語）後存成單張盤的快取 JSON，之後秒開
 * 檔案都放在專案的 data/interp/（已加入 .gitignore，不會上傳）。
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import readline from 'node:readline';
import * as OpenCC from 'opencc-js';
import SHA256 from './sha256.json';
import { zhFix } from '@/lib/zh-fix';

export const DATASET_TOPICS = [
  'overview', 'personality', 'love', 'career', 'wealth', 'health',
  'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents',
] as const;
export type DatasetTopic = typeof DATASET_TOPICS[number];

export const YEAR_MIN = 1950;
export const YEAR_MAX = 2026;
const RELEASE = 'https://github.com/Renhuai123/ziwei-doushu/releases/download/v4.0-13d';
const DATA_DIR = process.env.INTERP_DATA_DIR || path.join(process.cwd(), 'data', 'interp');
const CACHE_DIR = path.join(DATA_DIR, 'cache');

export interface Reading {
  key: string;
  mainStar: string | null;
  topics: Record<DatasetTopic, string>;
}

export class DatasetError extends Error {}

const toTw = (() => {
  const c = OpenCC.Converter({ from: 'cn', to: 'twp' });
  return (s: string) => zhFix(c(s));
})();

export const supportsZstd = typeof (zlib as any).createZstdDecompress === 'function';

const pad = (n: number) => String(n).padStart(2, '0');
export function readingKey(y: number, m: number, d: number, h: number, g: 'male' | 'female') {
  return `${y}-${pad(m)}-${pad(d)}-${h}-${g}`;
}

const inflightYear = new Map<number, Promise<string>>();
const inflightKey = new Map<string, Promise<Reading | null>>();

async function ensureYear(year: number): Promise<string> {
  const file = path.join(DATA_DIR, `year-${year}.jsonl.zst`);
  if (fs.existsSync(file)) return file;
  const running = inflightYear.get(year);
  if (running) return running;
  const job = (async () => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    let res: Response;
    try {
      res = await fetch(`${RELEASE}/year-${year}.jsonl.zst`, { redirect: 'follow' });
    } catch {
      throw new DatasetError('下載斷語庫失敗：請確認電腦有連上網路（只有第一次查這一年需要下載）。');
    }
    if (!res.ok) throw new DatasetError(`下載斷語庫失敗（HTTP ${res.status}），請稍後再試。`);
    const buf = Buffer.from(await res.arrayBuffer());
    const want = (SHA256 as Record<string, string>)[String(year)];
    const got = crypto.createHash('sha256').update(buf).digest('hex');
    if (want && got !== want) throw new DatasetError('下載的斷語庫檔案驗證失敗（可能下載不完整），請重新整理再試一次。');
    const tmp = `${file}.part`;
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, file);
    return file;
  })().finally(() => inflightYear.delete(year));
  inflightYear.set(year, job);
  return job;
}

async function scan(file: string, key: string): Promise<any | null> {
  const dec = (zlib as any).createZstdDecompress({ params: { [(zlib.constants as any).ZSTD_d_windowLogMax]: 27 } });
  const input = fs.createReadStream(file);
  const rl = readline.createInterface({ input: input.pipe(dec), crlfDelay: Infinity });
  const prefix = `{"k":"${key}"`;
  try {
    for await (const line of rl) {
      if (line.startsWith(prefix)) return JSON.parse(line);
    }
    return null;
  } finally {
    rl.close(); input.destroy(); dec.destroy();
  }
}

/** 查一張盤的 13 面向解讀；年份不在數據集範圍回傳 null */
export async function getReading(y: number, m: number, d: number, h: number, g: 'male' | 'female'): Promise<Reading | null> {
  if (y < YEAR_MIN || y > YEAR_MAX) return null;
  if (!supportsZstd) throw new DatasetError(`斷語庫需要 Node.js 22.15 以上（你的版本是 ${process.versions.node}），請到 nodejs.org 更新後重新啟動。`);
  const key = readingKey(y, m, d, h, g);
  const cacheFile = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(cacheFile)) {
    try { return JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch { /* 壞掉就重查 */ }
  }
  const running = inflightKey.get(key);
  if (running) return running;
  const job = (async () => {
    const file = await ensureYear(y);
    const row = await scan(file, key);
    if (!row) return null;
    const topics = {} as Record<DatasetTopic, string>;
    for (const t of DATASET_TOPICS) topics[t] = toTw(row.c?.[t] ?? '');
    const reading: Reading = { key, mainStar: row.ms ? toTw(row.ms) : null, topics };
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(reading));
    return reading;
  })().finally(() => inflightKey.delete(key));
  inflightKey.set(key, job);
  return job;
}

/** 這一年是否已下載（給前端顯示「第一次需要下載」的提示） */
export function hasYear(year: number) {
  return fs.existsSync(path.join(DATA_DIR, `year-${year}.jsonl.zst`));
}

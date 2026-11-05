/**
 * 倪海廈《天紀 · 紫微斗數》原話 1,848 條（繁體）
 * 來源：原專案 docs/tianji-ziwei/entries.jsonl（取自 Renhuai123/nihai-tianji-corpus）
 * 授權：CC BY-NC-SA 4.0 —— 可引用轉載須註明出處、不可商用、改作須同授權。原課程著作權屬倪海廈先生及其權利繼承人。
 */
import data from './quotes.json';

export interface Quote {
  /** 冊別：主星、宮位、四化… */ b: string;
  /** 章節 */ c: string;
  /** 小節 */ s: string;
  /** 原話 */ q: string;
  /** 影片分 P */ p: number;
  /** 秒數 */ t: number;
  /** 考據標註 */ n: string;
}

export const VIDEO_ID: string = data.video;
export const BOOKS: string[] = data.books;
export const QUOTES: Quote[] = data.quotes as Quote[];

export const quoteUrl = (q: Pick<Quote, 'p' | 't'>) => `https://www.bilibili.com/video/${VIDEO_ID}?p=${q.p}&t=${q.t}`;
export const fmtTime = (t: number) =>
  [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map(n => String(n).padStart(2, '0')).join(':');

/** 冊 → 章節（依原順序）與條數 */
export function categories() {
  const map = new Map<string, Map<string, number>>();
  for (const q of QUOTES) {
    if (!map.has(q.b)) map.set(q.b, new Map());
    const m = map.get(q.b)!;
    m.set(q.c, (m.get(q.c) ?? 0) + 1);
  }
  return BOOKS.filter(b => map.has(b)).map(b => ({
    book: b,
    total: [...map.get(b)!.values()].reduce((a, n) => a + n, 0),
    chapters: [...map.get(b)!.entries()].map(([name, count]) => ({ name, count })),
  }));
}

export const SOURCE_NOTE = '倪海廈《天紀》課程原話，整理自 Renhuai123/nihai-tianji-corpus，CC BY-NC-SA 4.0（不可商用）。點時間可跳回原影片核對。';

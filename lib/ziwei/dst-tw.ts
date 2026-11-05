/**
 * 台灣夏令時間（日光節約時間）與日治時期時區判定。
 *
 * ── 資料來源 ─────────────────────────────────────────────
 * 中央氣象署（原中央氣象局）公布的「台灣實施夏令時間／日光節約時間」一覽表：
 *   民國34–40年（1945–1951）5/1–9/30
 *   民國41年（1952）        3/1–10/31
 *   民國42–43年（1953–1954）4/1–10/31
 *   民國44–45年（1955–1956）4/1–9/30
 *   民國46–48年（1957–1959）4/1–9/30
 *   民國49–50年（1960–1961）6/1–9/30
 *   民國51–62年 停止
 *   民國63–64年（1974–1975）4/1–9/30
 *   民國65–67年 停止
 *   民國68年（1979）        7/1–9/30
 *   民國69年起 停止
 * 起訖日都含（整天算夏令時，與 dst-cn.ts 的主流排盤口徑相同）。
 *
 * 與 IANA tzdata（Asia/Taipei）比對（scripts/regression/dst-tw.test.ts 會逐日比）：
 *   · 1948–1979 全部一致；
 *   · 1945/9/21–9/30：IANA 記為已改回 UTC+8，氣象署表則把當年 5/1–9/30 都算夏令時 → 以氣象署為準；
 *   · 1946 IANA 為 5/15 起、1947 IANA 為 4/15–10/31，與氣象署表不同 → 以氣象署官方公告為準。
 *
 * 日治時期：1937/10/1 起台灣改用日本中央標準時（UTC+9），直到 1945/9/21 才改回 UTC+8；
 * 1945/9/21–9/30 又落在當年夏令時內，所以 1937/10/1–1945/9/30 鐘錶一律比現在快 1 小時。
 *
 * ── 為什麼只提示、不自動減 1 小時 ───────────────────────
 * 同 dst-cn.ts：程式無法知道使用者填的是當年鐘錶讀數，還是已經換算過的標準時間。
 * 所以只提示，由使用者自己按「減 1 小時」，可復原。
 */

/** [年, 起月, 起日, 止月, 止日]，起止日都含 */
const TW_DST: readonly (readonly [number, number, number, number, number])[] = [
  [1945, 5, 1, 9, 30], [1946, 5, 1, 9, 30], [1947, 5, 1, 9, 30], [1948, 5, 1, 9, 30],
  [1949, 5, 1, 9, 30], [1950, 5, 1, 9, 30], [1951, 5, 1, 9, 30],
  [1952, 3, 1, 10, 31],
  [1953, 4, 1, 10, 31], [1954, 4, 1, 10, 31],
  [1955, 4, 1, 9, 30], [1956, 4, 1, 9, 30],
  [1957, 4, 1, 9, 30], [1958, 4, 1, 9, 30], [1959, 4, 1, 9, 30],
  [1960, 6, 1, 9, 30], [1961, 6, 1, 9, 30],
  [1974, 4, 1, 9, 30], [1975, 4, 1, 9, 30],
  [1979, 7, 1, 9, 30],
] as const;

const ymd = (y: number, m: number, d: number) => y * 10000 + m * 100 + d;
const JST_START = ymd(1937, 10, 1);
const JST_END = ymd(1945, 9, 30);

export type TaiwanClockKind = 'dst' | 'jst';

export interface TaiwanClockShift {
  kind: TaiwanClockKind;
  /** 當年鐘錶比現在的標準時間快幾分鐘（目前都是 60） */
  aheadMinutes: number;
  /** 給畫面顯示的期間文字 */
  range: string;
}

/** 該國曆日期在台灣的鐘錶是否比現在快（夏令時或日治時期日本標準時）。不是則回傳 null。 */
export function taiwanClockShift(year: number, month: number, day: number): TaiwanClockShift | null {
  const v = ymd(year, month, day);
  if (v >= JST_START && v <= JST_END) {
    return { kind: 'jst', aheadMinutes: 60, range: '1937 年 10 月 1 日－1945 年 9 月 30 日（日治時期使用日本標準時）' };
  }
  for (const [y, m1, d1, m2, d2] of TW_DST) {
    if (y !== year) continue;
    if (v >= ymd(y, m1, d1) && v <= ymd(y, m2, d2)) {
      return { kind: 'dst', aheadMinutes: 60, range: `${y} 年 ${m1} 月 ${d1} 日－${m2} 月 ${d2} 日` };
    }
  }
  return null;
}

export function isTaiwanDST(year: number, month: number, day: number): boolean {
  return taiwanClockShift(year, month, day)?.kind === 'dst';
}

/** 該年是否曾實施夏令時（或屬日治時期），供表單提早提示 */
export function isTaiwanDSTYear(year: number): boolean {
  return (year >= 1937 && year <= 1945) || TW_DST.some(([y]) => y === year);
}

export const TAIWAN_DST_TABLE = TW_DST;

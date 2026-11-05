/**
 * 海外出生地的時區換算。
 *
 * 用瀏覽器與 Node 內建的 IANA 時區資料庫（Intl）查「出生那一刻，當地鐘錶比 UTC 快幾分鐘」，
 * 當年有沒有夏令時間、時區有沒有改過，都由時區資料庫處理，不用自己維護規則。
 * 台灣、港澳、中國大陸不走這裡：它們固定用 UTC+8，夏令時間由表單提醒使用者自己減 1 小時。
 */

const fmtCache = new Map<string, Intl.DateTimeFormat>();

function formatter(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
    });
    fmtCache.set(tz, f);
  }
  return f;
}

/** 某個 UTC 時刻在該時區的偏移（分鐘，東正西負） */
function offsetAtInstant(tz: string, utcMs: number): number {
  const parts = formatter(tz).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

/**
 * 當地鐘錶讀數 → 當時的 UTC 偏移（分鐘）。
 * 夏令時間切換那一小時會有重複或不存在的鐘點，這裡取切換前的偏移，與多數排盤軟體一致。
 */
export function utcOffsetAt(tz: string, year: number, month: number, day: number, hour = 12, minute = 0): number {
  try {
    const local = Date.UTC(year, month - 1, day, hour, minute);
    const first = offsetAtInstant(tz, local);
    const second = offsetAtInstant(tz, local - first * 60000);
    return second === first ? first : offsetAtInstant(tz, local - second * 60000);
  } catch {
    return 480;
  }
}

/** 該時區當年一月的偏移，當作「標準時間」；比它快就表示出生時正在實施夏令時間 */
export function standardOffset(tz: string, year: number): number {
  const jan = utcOffsetAt(tz, year, 1, 15);
  const jul = utcOffsetAt(tz, year, 7, 15);
  return Math.min(jan, jul);
}

/** 480 → "UTC+8"，330 → "UTC+5:30"，-300 → "UTC−5" */
export function formatUtcOffset(min: number): string {
  const sign = min >= 0 ? '+' : '−';
  const a = Math.abs(min);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}

/**
 * 出生鐘錶時間平移（夏令時 / 當年時區與現在不同）—— 純函式，排盤引擎層。
 *
 * 用途：出生那天當地在實行夏令時（如中國大陸 1986–1991 年夏季，見 dst-cn.ts），或當年時區與現在不同時，
 * 使用者報的往往是當年鐘錶讀數。排盤口徑按標準時間算（true-solar-time.ts），所以要先把鐘錶讀數換成標準時間。
 * 建議做成「使用者親手點、可撤銷」的按鈕，**不要自動改**：程式無法知道使用者填的是當年鐘錶讀數，還是已換算過的標準時間
 * （主流排盤軟體也只提示、不自動減，見 dst-cn.ts 檔案頭）。
 *
 * 換算方向：標準時間 = 鐘錶讀數 −（當年實際偏移 − 標準偏移）。
 *   · 中國大陸 1986–1991 夏令時：差 +60 分鐘 → 減 60；
 *   · 海外夏令時同理（如美東 −4:00 對 −5:00 → 減 60）；當年時區比現在慢（如馬來西亞 1982 年前 +7:30、現在 +8:00）：差 −30 → 加 30。
 *
 * 跨日（結果不在 0:00–23:59）一律給 null，不替使用者改日期：農曆月大小、閏月、晚子時換日交織，
 * 自動跨日容易改錯，交給使用者手動改日期和時間。
 */

export interface ClockTime { clockHour: string; clockMinute: string }

/** 當年鐘錶讀數 → 標準時間要平移的分鐘數（actual、std 都是相對 UTC 的分鐘偏移，東正西負） */
export function clockToStandardDelta(actualOffsetMin: number, stdOffsetMin: number): number {
  return stdOffsetMin - actualOffsetMin;
}

/** 鐘錶時間平移 deltaMin 分鐘；時 / 分沒填、不是整數、或平移後跨日，給 null */
export function shiftClock(t: ClockTime, deltaMin: number): ClockTime | null {
  if (t.clockHour === '' || t.clockMinute === '') return null;
  const h = Number(t.clockHour); const m = Number(t.clockMinute);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  if (!Number.isInteger(deltaMin) || deltaMin === 0) return null;
  const total = h * 60 + m + deltaMin;
  if (total < 0 || total >= 24 * 60) return null;
  return { clockHour: String(Math.floor(total / 60)), clockMinute: String(total % 60) };
}

/** 「HH:MM」兩位補零 */
export function formatClock(t: ClockTime): string {
  return `${t.clockHour.padStart(2, '0')}:${t.clockMinute.padStart(2, '0')}`;
}

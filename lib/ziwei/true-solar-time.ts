/**
 * 真太陽時統一計算。
 *
 * 口徑：地方真太陽時 = 鐘錶時間 + 經度修正 + 均時差；經度修正 =（出生地經度 − 鐘錶時區中央經線）× 4 分鐘。
 * 國內一律按東八區（中央經線 120°）。★ 2026-10-27 同步：海外出生地傳 utcOffsetMinutes（出生地時區的固定標準偏移），
 * 與主流排盤口徑一致——不處理夏令時與歷史時區；使用者填的若是當年鐘錶讀數，先用 clock-adjust.ts 換成標準時間再傳進來。
 * 均時差採用 NOAA 的 fractional-year 近似式，1900-2026 年範圍內足以穩定
 * 判斷紫微斗數的兩小時時辰邊界。
 *
 * 參考：https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 */

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

export type LateZishiRule = 'next-day' | 'current-day' | 'all-current' | 'day-cur-time-next';

export interface TrueSolarTimeInput extends GregorianDate {
  clockHour: number;
  clockMinute: number;
  /** 未提供經度時保持原鐘表時間，不做真太陽時校正。 */
  longitude?: number;
  /** 鐘錶時間所在時區的標準偏移（分鐘，東正西負）；不傳 = 北京時間 480（國內、老資料） */
  utcOffsetMinutes?: number;
}

export interface TrueSolarTimeResult {
  dateValid: boolean;
  corrected: boolean;
  longitudeCorrectionMinutes: number;
  equationOfTimeMinutes: number;
  totalCorrectionMinutes: number;
  rawMinutes: number;
  normalizedMinutes: number;
  dayOffset: number;
  hour: number;
  minute: number;
  second: number;
  branch: number;
}

const MINUTES_PER_DAY = 1440;
const SECONDS_PER_DAY = 86400;
const mod = (value: number, base: number) => ((value % base) + base) % base;

export function isValidGregorianDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function shiftGregorianDate(date: GregorianDate, dayOffset: number): GregorianDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + dayOffset));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function sameGregorianDate(a: GregorianDate, b: GregorianDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function dayOfYear(year: number, month: number, day: number): number {
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000);
}

/** NOAA 均時差近似值，返回分鐘；正值表示真太陽時快於平太陽時。 */
export function equationOfTimeMinutes(
  year: number,
  month: number,
  day: number,
  clockHour = 12,
  clockMinute = 0,
): number {
  if (!isValidGregorianDate(year, month, day)) return 0;
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const fractionalHour = clockHour + clockMinute / 60;
  const gamma = (2 * Math.PI / daysInYear)
    * (dayOfYear(year, month, day) - 1 + (fractionalHour - 12) / 24);
  return 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  );
}

export function branchFromSolarMinutes(normalizedMinutes: number): number {
  if (normalizedMinutes >= 1380 || normalizedMinutes < 60) return 0;
  return Math.floor((normalizedMinutes - 60) / 120) + 1;
}

export function calculateTrueSolarTime(input: TrueSolarTimeInput): TrueSolarTimeResult {
  const dateValid = isValidGregorianDate(input.year, input.month, input.day);
  const corrected = input.longitude !== undefined && Number.isFinite(input.longitude);
  // 中央經線 = 時區偏移 / 4（480 分鐘 → 120°）；國內仍是原式 (經度 − 120) × 4，結果逐位不變
  const meridian = input.utcOffsetMinutes !== undefined && Number.isFinite(input.utcOffsetMinutes) ? input.utcOffsetMinutes / 4 : 120;
  const longitudeCorrectionMinutes = corrected ? (input.longitude! - meridian) * 4 : 0;
  const eot = corrected && dateValid
    ? equationOfTimeMinutes(input.year, input.month, input.day, input.clockHour, input.clockMinute)
    : 0;
  const totalCorrectionMinutes = longitudeCorrectionMinutes + eot;
  const rawMinutes = input.clockHour * 60 + input.clockMinute + totalCorrectionMinutes;

  // 頁面輸入精度為分鐘；顯示和時辰邊界統一按最近一秒，避免浮點毛刺。
  const roundedTotalSeconds = Math.round(rawMinutes * 60);
  const dayOffset = Math.floor(roundedTotalSeconds / SECONDS_PER_DAY);
  const secondOfDay = mod(roundedTotalSeconds, SECONDS_PER_DAY);
  const hour = Math.floor(secondOfDay / 3600);
  const minute = Math.floor((secondOfDay % 3600) / 60);
  const second = secondOfDay % 60;
  const normalizedMinutes = secondOfDay / 60;

  return {
    dateValid,
    corrected,
    longitudeCorrectionMinutes,
    equationOfTimeMinutes: eot,
    totalCorrectionMinutes,
    rawMinutes,
    normalizedMinutes,
    dayOffset,
    hour,
    minute,
    second,
    branch: branchFromSolarMinutes(normalizedMinutes),
  };
}

/** 把真太陽日與晚子時流派規則合併成最終排盤日相對輸入日的偏移。 */
export function resolveZiweiDayOffset(
  solar: Pick<TrueSolarTimeResult, 'dayOffset' | 'normalizedMinutes' | 'branch'>,
  lateZishi: LateZishiRule = 'next-day',
): number {
  // day-cur-time-next changes the hour-pillar convention, not the Ziwei
  // main-chart date. Only the explicit next-day rule advances this date.
  const nextDayRule = lateZishi === 'next-day';
  const isLateZishi = solar.branch === 0 && solar.normalizedMinutes >= 1380;

  if (solar.dayOffset < 0 && isLateZishi) {
    return nextDayRule ? solar.dayOffset + 1 : solar.dayOffset;
  }
  if (solar.dayOffset !== 0) return solar.dayOffset;
  if (isLateZishi) return nextDayRule ? 1 : 0;
  return 0;
}

export function formatTrueSolarClock(solar: Pick<TrueSolarTimeResult, 'hour' | 'minute' | 'second'>, withSeconds = false): string {
  const base = `${String(solar.hour).padStart(2, '0')}:${String(solar.minute).padStart(2, '0')}`;
  return withSeconds ? `${base}:${String(solar.second).padStart(2, '0')}` : base;
}

export function formatSignedMinutes(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

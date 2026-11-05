import type { BirthFormState } from '@/components/BirthForm';
import type { BirthInfo } from './types';
import { branchFromSolarMinutes, resolveZiweiDayOffset, shiftGregorianDate } from './true-solar-time';
import { tzOf } from './cities';
import { utcOffsetAt } from './tz';

/**
 * 出生地鐘錶當時的 UTC 偏移（分鐘）。台灣、港澳、中國大陸固定 480（UTC+8）；
 * 海外依城市時區與出生日期時間自動算出，已含當地當年的夏令時間。
 */
export function utcOffsetForForm(form: Pick<BirthFormState, 'province' | 'city' | 'year' | 'month' | 'day' | 'clockHour' | 'clockMinute' | 'unknownTime'>): number {
  const tz = tzOf(form.province, form.city);
  if (!tz) return 480;
  const y = parseInt(form.year), m = parseInt(form.month), d = parseInt(form.day);
  if (!y || !m || !d) return utcOffsetAt(tz, new Date().getFullYear(), 1, 15);
  const h = form.unknownTime ? 12 : parseInt(form.clockHour) || 0;
  const mi = form.unknownTime ? 0 : parseInt(form.clockMinute) || 0;
  return utcOffsetAt(tz, y, m, d, h, mi);
}

/** 經度與時區造成的時差（分鐘）：經度 × 4 − 時區偏移；UTC+8 時就是（經度 − 120）× 4 */
export function longitudeOffsetMinutes(longitude: number, utcOffset = 480): number {
  return longitude * 4 - utcOffset;
}

/** 根據出生地鐘錶時間 + 經度（+ 時區）計算真太陽時時辰支 (0-11) */
export function calcTrueSolarBranch(clockHour: number, clockMinute: number, longitude: number, utcOffset = 480): number {
  const clockMins = clockHour * 60 + clockMinute;
  const offset = longitudeOffsetMinutes(longitude, utcOffset);
  const solar = ((clockMins + offset) % 1440 + 1440) % 1440;
  if (solar >= 1380 || solar < 60) return 0;
  return Math.floor((solar - 60) / 120) + 1;
}

/** BirthFormState → BirthInfo
 *
 * 子時規則（倪海廈體系/三合派標準）：
 * · 23:00-23:59 = 晚子時，**按次日**排盤（日期 +1）
 * · 00:00-00:59 = 早子時，按本日排盤
 * 這與「時辰支同為子(0)」並不衝突——子時分早晚兩段，需要在日期上區分。
 */
export function formToBirthInfo(form: BirthFormState): BirthInfo {
  let y = parseInt(form.year) || 0;
  let m = parseInt(form.month) || 0;
  let d = parseInt(form.day) || 0;
  let hour = 0;

  // 晚子時換日按真太陽時判定，與時辰支同一口徑（見 true-solar-time.ts 的 resolveZiweiDayOffset）。
  // 只看鐘錶 23 點會和經度校正後的時辰錯位：東經 100° 鐘錶 23:30 是真太陽時 22:10 亥時，不該換日。
  if (!form.unknownTime) {
    const solar = (parseInt(form.clockHour) || 0) * 60 + (parseInt(form.clockMinute) || 0) + longitudeOffsetMinutes(form.longitude, utcOffsetForForm(form));
    const normalizedMinutes = ((solar % 1440) + 1440) % 1440;
    hour = branchFromSolarMinutes(normalizedMinutes);
    const dayOffset = resolveZiweiDayOffset({ dayOffset: Math.floor(solar / 1440), normalizedMinutes, branch: hour });
    if (dayOffset !== 0 && y > 0 && m > 0 && d > 0) {
      ({ year: y, month: m, day: d } = shiftGregorianDate({ year: y, month: m, day: d }, dayOffset));
    }
  }

  return {
    year: y, month: m, day: d,
    hour,
    gender: form.gender,
    name: form.name || undefined,
    province: form.province || undefined,
    city: form.city || undefined,
    longitude: form.province ? form.longitude : undefined,
  };
}

/** BirthFormState → URLSearchParams（用於分享連結） */
export function formToSearchParams(form: BirthFormState): URLSearchParams {
  const p = new URLSearchParams();
  if (form.name) p.set('n', form.name);
  p.set('y', form.year);
  p.set('m', form.month);
  p.set('d', form.day);
  if (form.unknownTime) {
    p.set('u', '1');
  } else {
    p.set('h', form.clockHour);
    p.set('mi', form.clockMinute);
  }
  if (form.province) p.set('p', form.province);
  if (form.city) p.set('c', form.city);
  if (form.longitude && form.longitude !== 120) p.set('lo', String(form.longitude));
  p.set('g', form.gender === 'male' ? 'm' : 'f');
  return p;
}

/** URLSearchParams → Partial<BirthFormState>，不完整時返回 null */
export function searchParamsToForm(params: URLSearchParams): Partial<BirthFormState> | null {
  const year = params.get('y');
  const month = params.get('m');
  const day = params.get('d');
  if (!year || !month || !day) return null;
  return {
    name: params.get('n') || '',
    year,
    month,
    day,
    unknownTime: params.get('u') === '1',
    clockHour: params.get('h') || '8',
    clockMinute: params.get('mi') || '0',
    province: params.get('p') || '',
    city: params.get('c') || '',
    longitude: parseFloat(params.get('lo') || '120'),
    gender: params.get('g') === 'f' ? 'female' : 'male',
  };
}

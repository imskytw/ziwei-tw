/**
 * formToBirthInfo：晚子時換日要按真太陽時判定，與時辰支同一口徑。
 *
 * 時辰支按經度校正後的真太陽時算，換日卻曾只看鐘錶「23 點」，兩者錯位時排盤日差一天：
 *   · 東經 100° 鐘錶 23:30 → 真太陽時 22:10 亥時，卻被挪到次日 → 排成次日亥時；
 *   · 東經 135° 鐘錶 22:30 → 真太陽時 23:30 晚子時，卻留在本日 → 排成本日早子時；
 *   · 東經 80° 鐘錶 00:30 → 真太陽時前一日 21:50 亥時，卻留在本日 → 排成本日亥時。
 * 換日口徑與 lib/ziwei/true-solar-time.ts 的 resolveZiweiDayOffset('next-day') 一致。
 */
import assert from 'node:assert/strict';
import { formToBirthInfo } from '../../lib/ziwei/share';
import type { BirthFormState } from '../../components/BirthForm';

function formAt(clockHour: string, clockMinute: string, longitude: number): BirthFormState {
  return {
    name: '',
    year: '2000',
    month: '1',
    day: '31',
    clockHour,
    clockMinute,
    unknownTime: false,
    province: longitude === 120 ? '' : '測試',
    city: '',
    longitude,
    gender: 'male',
  };
}

const pick = (b: ReturnType<typeof formToBirthInfo>) => ({ year: b.year, month: b.month, day: b.day, hour: b.hour });

const cases: Array<[string, string, number, { year: number; month: number; day: number; hour: number }, string]> = [
  ['23', '30', 120, { year: 2000, month: 2, day: 1, hour: 0 }, '東經 120° 23:30 晚子時 → 次日子時'],
  ['0', '30', 120, { year: 2000, month: 1, day: 31, hour: 0 }, '東經 120° 00:30 早子時 → 本日子時'],
  ['23', '30', 100, { year: 2000, month: 1, day: 31, hour: 11 }, '東經 100° 23:30（真太陽時 22:10）→ 本日亥時'],
  ['22', '30', 135, { year: 2000, month: 2, day: 1, hour: 0 }, '東經 135° 22:30（真太陽時 23:30）→ 次日子時'],
  ['0', '30', 80, { year: 2000, month: 1, day: 30, hour: 11 }, '東經 80° 00:30（真太陽時前一日 21:50）→ 前一日亥時'],
  ['23', '50', 130, { year: 2000, month: 2, day: 1, hour: 0 }, '東經 130° 23:50（真太陽時次日 00:30）→ 次日子時'],
];

for (const [h, mi, lon, expected, label] of cases) {
  assert.deepEqual(pick(formToBirthInfo(formAt(h, mi, lon))), expected, label);
}

const unknown = formToBirthInfo({ ...formAt('23', '30', 100), unknownTime: true });
assert.deepEqual(pick(unknown), { year: 2000, month: 1, day: 31, hour: 0 }, '時辰不詳不換日');

console.log('form true-solar day rollover regression passed');

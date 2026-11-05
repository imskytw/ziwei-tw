/**
 * 回歸：出生鐘錶時間平移（lib/ziwei/clock-adjust.ts）與海外時區的真太陽時（true-solar-time.ts 的 utcOffsetMinutes）。
 *
 *   · 平移方向：標準時間 = 鐘錶讀數 −（當年實際偏移 − 標準偏移）；跨日不改（給 null）。
 *   · 國內不傳 utcOffsetMinutes 與傳 480 逐日結果一致；海外按出生地時區的中央經線做經度修正。
 */
import { clockToStandardDelta, formatClock, shiftClock } from '../../lib/ziwei/clock-adjust';
import { calculateTrueSolarTime } from '../../lib/ziwei/true-solar-time';

let fails = 0;
function ok(name: string, cond: boolean) {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) fails++;
}
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

ok('中國大陸夏令時（+9:00 對 +8:00）→ 減 60', clockToStandardDelta(540, 480) === -60);
ok('美東夏令時（-4:00 對 -5:00）→ 減 60', clockToStandardDelta(-240, -300) === -60);
ok('馬來西亞 1982 年前（+7:30 對 +8:00）→ 加 30', clockToStandardDelta(450, 480) === 30);

ok('14:30 減 60 → 13:30', eq(shiftClock({ clockHour: '14', clockMinute: '30' }, -60), { clockHour: '13', clockMinute: '30' }));
ok('1:05 減 60 → 0:05', eq(shiftClock({ clockHour: '1', clockMinute: '5' }, -60), { clockHour: '0', clockMinute: '5' }));
ok('0:30 減 60 跨到前一天 → null', shiftClock({ clockHour: '0', clockMinute: '30' }, -60) === null);
ok('8:15 加 30 → 8:45', eq(shiftClock({ clockHour: '8', clockMinute: '15' }, 30), { clockHour: '8', clockMinute: '45' }));
ok('23:45 加 30 跨到後一天 → null', shiftClock({ clockHour: '23', clockMinute: '45' }, 30) === null);
ok('時沒填 → null', shiftClock({ clockHour: '', clockMinute: '0' }, -60) === null);
ok('平移 0 分鐘 → null', shiftClock({ clockHour: '9', clockMinute: '0' }, 0) === null);
ok('formatClock 補零', formatClock({ clockHour: '7', clockMinute: '5' }) === '07:05');

// 國內：不傳偏移 = 傳 480，逐日抽查結果完全一致
let same = true;
for (let m = 1; m <= 12; m++) {
  for (const d of [1, 15, 28]) {
    const base = { year: 1990, month: m, day: d, clockHour: 9, clockMinute: 16, longitude: 116.4 };
    if (!eq(calculateTrueSolarTime(base), calculateTrueSolarTime({ ...base, utcOffsetMinutes: 480 }))) same = false;
  }
}
ok('國內不傳 utcOffsetMinutes 與傳 480 結果一致', same);

// 海外：紐約（經度 -74.0，美東標準 -5:00，中央經線 -75°）→ 經度修正 (-74 − (-75)) × 4 = +4 分鐘
const ny = calculateTrueSolarTime({ year: 1995, month: 1, day: 15, clockHour: 14, clockMinute: 0, longitude: -74, utcOffsetMinutes: -300 });
ok('紐約經度修正 +4 分鐘', Math.abs(ny.longitudeCorrectionMinutes - 4) < 1e-9);

if (fails) { console.error(`\n✗ 鐘錶時間平移回歸 ${fails} 項未過`); process.exit(1); }
console.log('\n✓ 鐘錶時間平移回歸全部透過');

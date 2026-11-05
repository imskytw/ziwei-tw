/** 海外出生地：時區（含當地夏令時間）換算與真太陽時時辰 */
import assert from 'node:assert/strict';
import { utcOffsetAt, standardOffset, formatUtcOffset } from '../../lib/ziwei/tz';
import { formToBirthInfo } from '../../lib/ziwei/share';
import { PROVINCES, tzOf } from '../../lib/ziwei/cities';

assert.equal(utcOffsetAt('America/New_York', 1990, 7, 4, 10, 0), -240);
assert.equal(utcOffsetAt('America/New_York', 1990, 1, 4, 10, 0), -300);
assert.equal(utcOffsetAt('Asia/Tokyo', 1950, 7, 1, 10, 0), 600);   // 日本 1948–1951 曾實施夏令時間
assert.equal(utcOffsetAt('Australia/Sydney', 2000, 1, 1, 10, 0), 660);
assert.equal(utcOffsetAt('Asia/Kolkata', 1990, 1, 1, 10, 0), 330);
assert.equal(utcOffsetAt('Asia/Singapore', 1975, 1, 1, 10, 0), 450); // 新加坡 1982 年前是 UTC+7:30
assert.equal(standardOffset('America/Los_Angeles', 1990), -480);
assert.equal(formatUtcOffset(-240), 'UTC−4');
assert.equal(formatUtcOffset(330), 'UTC+5:30');

const base = { name: '', year: '1990', month: '7', day: '4', clockHour: '10', clockMinute: '0', unknownTime: false, gender: 'male' as const };
// 洛杉磯夏令時間 10:00 → 真太陽時約 09:07，巳時
assert.equal(formToBirthInfo({ ...base, province: '美國', city: '洛杉磯', longitude: -118.24 }).hour, 5);
// 台灣維持原口徑
assert.equal(formToBirthInfo({ ...base, province: '台北市', city: '大安區', longitude: 121.547 }).hour, 5);

// 每個海外城市都有可用的時區
for (const p of PROVINCES.filter(x => x.region === 'intl')) {
  for (const c of p.cities) {
    const tz = tzOf(p.name, c.name);
    assert.ok(tz, `${p.name}${c.name} 沒有時區`);
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en-US', { timeZone: tz }));
  }
}
console.log('✓ 海外時區與夏令時間換算通過');

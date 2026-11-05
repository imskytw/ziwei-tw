/**
 * 台灣夏令時回歸：
 * 1. 逐日與 IANA Asia/Taipei 比對 1930–1990（只允許檔頭註明的 1946、1947 差異）
 * 2. 幾個關鍵日期的人工案例
 */
import assert from 'node:assert/strict';
import { taiwanClockShift, isTaiwanDST, isTaiwanDSTYear } from '../../lib/ziwei/dst-tw';

const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', timeZoneName: 'longOffset' });
const ianaAhead = (y: number, m: number, d: number) => {
  // 取當地中午，避開 0 點切換的模糊
  const off = fmt.formatToParts(new Date(Date.UTC(y, m - 1, d, 4))).find(p => p.type === 'timeZoneName')!.value;
  return off === 'GMT+09:00';
};

// 1945/9/21–9/30、1946、1947：氣象署表與 IANA 不同，以氣象署為準（見 dst-tw.ts 檔頭）
const KNOWN_DIFF_YEARS = new Set([1946, 1947]);
const isKnownDiff = (y: number, m: number, d: number) => KNOWN_DIFF_YEARS.has(y) || (y === 1945 && m === 9 && d >= 21);
let checked = 0, mismatches: string[] = [];
for (let t = Date.UTC(1930, 0, 1); t < Date.UTC(1991, 0, 1); t += 864e5) {
  const dt = new Date(t);
  const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
  const ours = taiwanClockShift(y, m, d) !== null;
  const theirs = ianaAhead(y, m, d);
  checked++;
  // 9/21 前一天以前 IANA 是 JST 整天；9/30 是夏令時最後一天，IANA 在 10/1 0 時切回 → 中午取樣一致
  if (ours !== theirs && !isKnownDiff(y, m, d)) mismatches.push(`${y}-${m}-${d} ours=${ours} iana=${theirs}`);
}
assert.deepEqual(mismatches, [], `與 IANA 不一致：\n${mismatches.slice(0, 20).join('\n')}`);

// 人工案例
assert.equal(isTaiwanDST(1974, 4, 1), true, '1974/4/1 起始日含');
assert.equal(isTaiwanDST(1974, 9, 30), true, '1974/9/30 結束日含');
assert.equal(isTaiwanDST(1974, 10, 1), false, '1974/10/1 已結束');
assert.equal(isTaiwanDST(1979, 6, 30), false);
assert.equal(isTaiwanDST(1979, 7, 1), true);
assert.equal(isTaiwanDST(1980, 7, 1), false, '1980 起停止');
assert.equal(isTaiwanDST(1965, 7, 1), false, '1962–1973 停止');
assert.equal(isTaiwanDST(1946, 5, 1), true, '1946 依氣象署 5/1 起');
assert.equal(taiwanClockShift(1940, 1, 15)?.kind, 'jst', '日治時期全年 UTC+9');
assert.equal(taiwanClockShift(1937, 9, 30), null);
assert.equal(isTaiwanDSTYear(1975), true);
assert.equal(isTaiwanDSTYear(1985), false);
console.log(`✓ 台灣夏令時回歸通過（逐日比對 ${checked} 天）`);

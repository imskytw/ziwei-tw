/**
 * BirthForm → BirthInfo 轉換一致性回歸
 *
 * 背景：`BirthFormState → BirthInfo` 的轉換在本倉庫裡必須只有一處實現——
 * `lib/ziwei/share.ts` 的 `formToBirthInfo()`，它負責「晚子時換日」：
 * 23:00–23:59 出生按**次日**排盤。這條規則是三處規格共同確定的：
 *   · `lib/ziwei/types.ts` 宣告 `BirthInfo.year` 是「已經過子時換日修正後的排盤日」；
 *   · `README.md` 時辰對照表下一行：「23:00–23:59 出生（晚子時）按次日排盤、時辰取 0」；
 *   · `scripts/regression/iztro-time-index-boundary.test.ts` 已把它釘成斷言。
 *
 * 但 `components/BirthForm.tsx` 的 `handleSubmit` 曾經自行拼裝 BirthInfo，
 * `year/month/day` 直接用表單原值，繞過了換日。於是同一次出生輸入：
 *   · `/chart`（`BirthForm.onSubmit` → `generateChart`）排出「填的那天」的盤；
 *   · `/heming`（`formToBirthInfo` → `generateChart`）排出「次日」的盤。
 * 兩條路徑相差一整天，整張命盤（十二宮、星曜、四化）都不一樣。
 *
 * 本回歸釘住三件事：
 *   1. BirthForm 必須複用 `formToBirthInfo`，不得自行拼裝 BirthInfo；
 *   2. BirthForm 不得再帶一份自己的 `calcTrueSolarBranch`（真太陽時只有一處實現）；
 *   3. `formToBirthInfo` 的晚子時 / 早子時邊界行為，含跨月與跨年進位。
 *
 * 第 1、2 條走原始碼解析（元件是 .tsx，倉庫沒有 DOM 測試環境），
 * 與 `famous-hour-consistency.test.ts` 同一做法。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formToBirthInfo } from '../../lib/ziwei/share';
import type { BirthFormState } from '../../components/BirthForm';

const src = readFileSync(new URL('../../components/BirthForm.tsx', import.meta.url), 'utf8');

// ── 1) 轉換隻有一處實現：BirthForm 必須複用 share.ts ──────────────
assert.match(
  src,
  /import\s*\{[^}]*\bformToBirthInfo\b[^}]*\}\s*from\s*'@\/lib\/ziwei\/share'/,
  'BirthForm 必須從 @/lib/ziwei/share 引入 formToBirthInfo，不能自己拼 BirthInfo',
);

assert.equal(
  /onSubmit\(\s*\{/.test(src),
  false,
  'BirthForm 的 onSubmit 不應收到手拼的對象字面量——晚子時換日會因此被繞過，請改走 formToBirthInfo',
);

// ── 2) 真太陽時時辰只有一處實現 ─────────────────────────────────
assert.equal(
  /function\s+calcTrueSolarBranch\s*\(/.test(src),
  false,
  'BirthForm 不得重複實現 calcTrueSolarBranch，請複用 lib/ziwei/share.ts 的同名匯出',
);

// ── 3) formToBirthInfo 的邊界行為 ───────────────────────────────
function formAt(
  year: string,
  month: string,
  day: string,
  clockHour: string,
  clockMinute = '30',
  overrides: Partial<BirthFormState> = {},
): BirthFormState {
  return {
    name: '',
    year,
    month,
    day,
    clockHour,
    clockMinute,
    unknownTime: false,
    province: '',
    city: '',
    longitude: 120,
    gender: 'male',
    ...overrides,
  };
}

const pick = (b: ReturnType<typeof formToBirthInfo>) => ({
  year: b.year,
  month: b.month,
  day: b.day,
  hour: b.hour,
});

// 晚子時：按次日排盤、時辰取 0
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '1', '31', '23'))),
  { year: 2000, month: 2, day: 1, hour: 0 },
  '1/31 23:30 晚子時應排到 2/1、時辰支 0',
);
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '12', '31', '23'))),
  { year: 2001, month: 1, day: 1, hour: 0 },
  '跨年：12/31 23:30 應排到次年 1/1',
);
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '2', '28', '23'))),
  { year: 2000, month: 2, day: 29, hour: 0 },
  '閏年：2/28 23:30 應排到 2/29',
);
assert.deepEqual(
  pick(formToBirthInfo(formAt('2001', '2', '28', '23'))),
  { year: 2001, month: 3, day: 1, hour: 0 },
  '平年：2/28 23:30 應排到 3/1',
);
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '1', '31', '23', '0'))),
  { year: 2000, month: 2, day: 1, hour: 0 },
  '23:00 整點即進入晚子時',
);

// 早子時與 22:xx：不換日
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '1', '31', '0'))),
  { year: 2000, month: 1, day: 31, hour: 0 },
  '00:30 早子時留在本日、時辰支同為 0',
);
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '1', '31', '22', '59'))),
  { year: 2000, month: 1, day: 31, hour: 11 },
  '22:59 是亥時，不應換日',
);

// 時辰不詳：不換日、支取 0
assert.deepEqual(
  pick(formToBirthInfo(formAt('2000', '1', '31', '23', '30', { unknownTime: true }))),
  { year: 2000, month: 1, day: 31, hour: 0 },
  '時辰不詳時不應按晚子時換日',
);

console.log('✅ BirthForm→BirthInfo 轉換一致性：單一實現 + 晚子時邊界（跨月/跨年）均正確');

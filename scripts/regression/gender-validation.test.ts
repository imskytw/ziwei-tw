import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { BirthInfo } from '../../lib/ziwei/types';

const base: BirthInfo = { year: 1925, month: 3, day: 1, hour: 6, gender: 'male' };

// 執行時非法 gender 必須在排盤前拋 RangeError，不能被靜默當成「女」
for (const gender of ['typo', '', 'MALE', 'Male', '男', 'female ', 'm', null, undefined, 0, 1, {}] as never[]) {
  assert.throws(
    () => generateChart({ ...base, gender }),
    RangeError,
    `${String(gender)} should be rejected`,
  );
}

// 合法值行為保持不變
const male = generateChart({ ...base, gender: 'male' });
assert.equal(male.birthInfo.gender, 'male');
assert.ok(male.yinYangGender?.includes('男'), 'male chart should be 陽男/陰男');

const female = generateChart({ ...base, gender: 'female' });
assert.equal(female.birthInfo.gender, 'female');
assert.ok(female.yinYangGender?.includes('女'), 'female chart should be 陽女/陰女');

console.log('gender validation regression passed');

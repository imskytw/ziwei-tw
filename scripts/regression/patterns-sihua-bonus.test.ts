/**
 * 格局加分項裡的「化祿 / 化權 / 化科」要按星曜的 siHua 欄位判，不是按星名。
 *
 * 四化掛在 Star.siHua 上（如 { name: '天機', siHua: '科' }），盤上沒有叫「化科」的星。
 * 早先府相朝垣「命宮見祿」、陽梁昌祿 / 機月同梁「再會化科」、殺破狼「三方有化祿或化權」
 * 用 hasStar / sanFangAllStars 查「化X」星名，永遠查不到，這幾條加分項從來不會出現。
 *
 * patterns.ts 帶 `server-only`（倉庫裡沒裝這個包，Next 構建時才有），這裡先把它解析成空模組再 import。
 */
import assert from 'node:assert/strict';
import * as nodeModule from 'node:module';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { ZiweiChart, SiHua } from '../../lib/ziwei/types';

// module.registerHooks：Node 22.15+ / 23.5+；@types/node 20 還沒有它的宣告，這裡自帶最小型別
type HookResult = { url?: string; format?: string; source?: string; shortCircuit?: boolean };
const { registerHooks } = nodeModule as unknown as {
  registerHooks(hooks: {
    resolve(specifier: string, context: unknown, next: (s: string, c: unknown) => HookResult): HookResult;
    load(url: string, context: unknown, next: (u: string, c: unknown) => HookResult): HookResult;
  }): void;
};
const SERVER_ONLY_STUB = 'data:text/javascript,';
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') return { url: SERVER_ONLY_STUB, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === SERVER_ONLY_STUB) return { format: 'commonjs', source: '', shortCircuit: true };
    return nextLoad(url, context);
  },
});

function sanFangHasSiHua(chart: ZiweiChart, hua: SiHua): boolean {
  const m = chart.mingGongBranch;
  const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
  return chart.palaces.some(p => branches.includes(p.branch) && p.stars.some(s => s.siHua === hua));
}

async function main() {
const { detectPatterns } = await import('../../lib/ziwei/patterns');

// 盤上不存在名為「化X」的星
const sample = generateChart({ year: 1988, month: 10, day: 8, hour: 7, gender: 'male' });
assert.ok(sample.palaces.every(p => p.stars.every(s => !/^化[祿權科忌]$/.test(s.name))), '星名裡出現了「化X」');

// 逐日掃一年、固定午時，統計每個加分項「該出現」與「實際出現」的盤數
const checks: { pattern: string; bonus: string; expect: (c: ZiweiChart) => boolean }[] = [
  {
    pattern: '府相朝垣', bonus: '命宮見祿',
    expect: c => c.palaces.some(p => p.branch === c.mingGongBranch && p.stars.some(s => s.name === '祿存' || s.siHua === '祿')),
  },
  { pattern: '殺破狼', bonus: '三方有化祿或化權（動得有力）', expect: c => sanFangHasSiHua(c, '祿') || sanFangHasSiHua(c, '權') },
  { pattern: '機月同梁', bonus: '再會化科', expect: c => sanFangHasSiHua(c, '科') },
  { pattern: '陽梁昌祿', bonus: '再會化科', expect: c => sanFangHasSiHua(c, '科') },
];
const hits = new Map<string, number>();
const start = Date.UTC(1990, 0, 1);
for (let d = 0; d < 366; d++) {
  const dt = new Date(start + d * 86_400_000);
  const chart = generateChart({
    year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate(), hour: 6, gender: 'male',
  });
  const found = detectPatterns(chart);
  for (const { pattern, bonus, expect } of checks) {
    const p = found.find(x => x.name === pattern);
    if (!p) continue;
    const want = expect(chart);
    const got = p.conditions?.bonus?.includes(bonus) ?? false;
    assert.equal(got, want, `${dt.toISOString().slice(0, 10)} 午時 ${pattern}「${bonus}」應為 ${want}`);
    if (got) hits.set(pattern, (hits.get(pattern) ?? 0) + 1);
  }
}
for (const { pattern } of checks) {
  assert.ok((hits.get(pattern) ?? 0) > 0, `${pattern} 的四化加分項一次都沒觸發，樣本覆蓋不到或判斷仍按星名`);
}

console.log(`✓ 格局四化加分項按 siHua 判定（觸發盤數：${[...hits].map(([k, v]) => `${k} ${v}`).join('、')}）`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

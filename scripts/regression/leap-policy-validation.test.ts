/**
 * 回歸：閏月歸屬 policy 的執行時校驗與四口徑互異性。
 *
 * `generateChart` / `resolveEffectiveLunarDate` 可從執行時 JavaScript 與 JSON API 直接呼叫，
 * `LunarMonthPolicy` 的字面量聯合型別形同虛設。拼錯的 policy 原本會落進 if/else 鏈尾部、
 * 靜默按「歸本月」排盤，且錯誤值隨 `chart.birthInfo.leapMonthPolicy` 序列化傳播——
 * 與 gender 校驗（#38）同族：型別在執行時不設防。
 *
 * 口徑神諭表（獨立謄寫自 README/註釋裡的四口徑定義，不引用被測實現的分支）：
 * 對閏月內的某日（rawLunarDay 記 d）：
 *   origin-month → 真閏本月（isLeapMonth=true，月份不變）
 *   prev-month   → 歸本月（isLeapMonth=false，月份不變）
 *   split        → d ≤ 15 歸本月，d > 15 歸下月（isLeapMonth=false）
 *   next-month   → 歸下月（月份 +1，isLeapMonth=false）
 *
 * 為什麼值得這麼較真：閏月歸屬差一個月，命宮/身宮/四化整盤皆錯，而拼錯 policy
 * 原本沒有任何報錯。
 */
import { generateChart, resolveEffectiveLunarDate } from '../../lib/ziwei/algorithm';

const POLICIES = ['split', 'next-month', 'prev-month', 'origin-month'] as const;

/** 2025 年閏六月（公曆 2025-07-25 ~ 2025-08-22），取上半月與下半月各一天。 */
const LEAP_MONTH_DATES: Array<[number, number, number]> = [
  [2025, 8, 10], // 閏六月初十（上半月）
  [2025, 8, 18], // 閏六月下旬（下半月）
];

let bad = 0;
const fail = (m: string) => { bad++; console.log(`  ❌ ${m}`); };

/* ── ① 無效 policy 必須當場 RangeError ──────────────────────────── */
{
  console.log('① 無效 policy 當場拒絕');
  const invalid: unknown[] = ['nextmonth', 'next-monthh', '', 'NEXT-MONTH', null, 42, true];
  for (const p of invalid) {
    try {
      resolveEffectiveLunarDate(2025, 8, 10, p as never);
      fail(`policy=${JSON.stringify(p)} 未被拒絕（靜默按歸本月排盤）`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!(e instanceof RangeError) || !msg.includes('leapMonth policy')) {
        fail(`policy=${JSON.stringify(p)} 拋錯型別/資訊不對：${msg}`);
      }
    }
  }
  if (!bad) console.log('  ✅ 7 個無效值全部 RangeError 且資訊點名 leapMonth policy');
}

/* ── ② 顯式 undefined = 走預設值，不得報錯 ──────────────────────── */
{
  console.log('② 顯式 undefined 走預設 prev-month');
  try {
    const r = resolveEffectiveLunarDate(2025, 8, 10);
    console.log('  ✅ 預設口徑可用');
    void r;
  } catch (e) {
    fail(`預設呼叫被誤拒：${e instanceof Error ? e.message : String(e)}`);
  }
}

/* ── ③ 四口徑在閏月內互異，且與神諭表逐項一致 ────────────────────── */
{
  console.log('③ 四口徑與神諭表逐項一致（閏六月上/下半月各一天）');
  for (const [y, m, d] of LEAP_MONTH_DATES) {
    for (const policy of POLICIES) {
      const r = resolveEffectiveLunarDate(y, m, d, policy);
      if (r.rawLunarMonth !== -6) {
        fail(`${y}-${m}-${d} 不是閏六月（rawLunarMonth=${r.rawLunarMonth}），神諭表基準失效`);
        continue;
      }
      const day = r.rawLunarDay;
      // 神諭表：按四口徑定義獨立謄寫
      const want =
        policy === 'origin-month' ? { month: 6, leap: true }
        : policy === 'prev-month' ? { month: 6, leap: false }
        : policy === 'next-month' ? { month: 7, leap: false }
        : (day > 15 ? { month: 7, leap: false } : { month: 6, leap: false });
      if (r.lunarMonth !== want.month || r.isLeapMonth !== want.leap) {
        fail(`${policy} @ 閏六月${day}日 → 實得 (月${r.lunarMonth}, 閏=${r.isLeapMonth})，應為 (月${want.month}, 閏=${want.leap})`);
      }
    }
  }
  if (!bad) console.log('  ✅ 四口徑 × 兩日期全部與神諭表一致');
}

/* ── ④ generateChart 端到端：合法 policy 正常排盤並回寫 ──────────── */
{
  console.log('④ generateChart 端到端（合法 policy 排盤並回寫 leapMonthPolicy）');
  for (const policy of POLICIES) {
    try {
      const chart = generateChart(
        { year: 2025, month: 8, day: 10, hour: 5, gender: 'female' },
        { leapMonth: policy },
      );
      const echoed = (chart.birthInfo as { leapMonthPolicy?: string }).leapMonthPolicy;
      if (echoed !== policy) fail(`policy=${policy} 回寫不符：${String(echoed)}`);
      if (!chart.palaces || chart.palaces.length !== 12) fail(`policy=${policy} 排盤結果異常`);
    } catch (e) {
      fail(`policy=${policy} 排盤拋錯：${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (!bad) console.log('  ✅ 四口徑端到端排盤正常，leapMonthPolicy 回寫一致');
}

if (bad) {
  console.error(`\n❌ ${bad} 項不符 —— 閏月歸屬 policy 校驗或口徑與定義不一致，會導致整盤錯位。`);
  process.exit(1);
}
console.log('\n✅ 全部通過：無效 policy 當場拒絕，四口徑互異且與定義一致。');

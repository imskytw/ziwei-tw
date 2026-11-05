/** OpenCC（cn→twp）轉換後的命理用字修正。與 scripts/sync-upstream/zh_fix.py 保持同一套規則。 */
const KEEP_DOU = /(奮鬥|獨鬥|爭鬥|鬥爭|戰鬥|打鬥|搏鬥|格鬥|鬥志|鬥嘴|決鬥|械鬥|惡鬥|纏鬥|鬥智|鬥毆|鬥法|鬥士|好鬥|鬥勝|鬥氣)/;
export function zhFix(s: string): string {
  s = s.replace(/醜/g, '丑').replace(/臺/g, '台');
  s = s.split(KEEP_DOU).map((p, i) => (i % 2 ? p : p.replace(/鬥/g, '斗'))).join('');
  s = s.replace(/(?<=[宮年月日時限天])幹/g, '干').replace(/幹支/g, '干支');
  s = s.replace(/迴圈/g, '循環').replace(/迴歸/g, '回歸');
  s = s.replace(/(?<!配置)物件/g, '對象');
  s = s.replace(/已透過/g, '已通過').replace(/在字型上面/g, '在字形上面');
  // 吉凶、凶星、凶格、逢凶化吉用「凶」；形容人兇悍（很兇、兇手）保留「兇」
  s = s.replace(/(?<=[吉化避藏逢則之三趨])兇|兇(?=[格星處光災中吉年運限神煞象兆險])/g, '凶');
  return s;
}

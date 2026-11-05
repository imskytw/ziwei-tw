"""OpenCC（s2twp）轉換後的命理用字修正。與 lib/zh-fix.ts 保持同一套規則。"""
import re
KEEP_DOU = r'(奮鬥|獨鬥|爭鬥|鬥爭|戰鬥|打鬥|搏鬥|格鬥|鬥志|鬥嘴|決鬥|械鬥|惡鬥|纏鬥|鬥智|鬥毆|鬥法|鬥士|好鬥|鬥勝|鬥氣)'
def fix(s: str) -> str:
    s = s.replace('醜', '丑').replace('臺', '台')
    # 鬥 → 斗（南斗、北斗、斗數、斗君、朝斗），保留真正「打鬥」義的詞
    parts = re.split(KEEP_DOU, s)
    s = ''.join(p if i % 2 else p.replace('鬥', '斗') for i, p in enumerate(parts))
    # 天干：宮干、年干、流年干、干支
    s = re.sub(r'(?<=[宮年月日時限天])幹', '干', s)
    s = s.replace('幹支', '干支')
    s = s.replace('迴圈', '循環').replace('迴歸', '回歸')
    s = re.sub(r'(?<!配置)物件', '對象', s)
    s = s.replace('已透過', '已通過').replace('在字型上面', '在字形上面')
    # 吉凶、凶星、凶格、逢凶化吉用「凶」；形容人兇悍（很兇、兇手）保留「兇」
    s = re.sub(r'(?<=[吉化避藏逢則之三趨])兇|兇(?=[格星處光災中吉年運限神煞象兆險])', '凶', s)
    return s

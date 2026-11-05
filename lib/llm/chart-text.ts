import 'server-only';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';
import { detectPatterns } from '@/lib/ziwei/patterns';

/** 把命盤整理成精簡的文字，給 AI 閱讀（比整包 JSON 省 token、也更不容易誤讀） */
export function chartToText(chart: ZiweiChart, title = '命盤'): string {
  const b = chart.birthInfo, l = chart.lunarInfo;
  const lines: string[] = [];
  lines.push(`【${title}】`);
  lines.push(`性別：${b.gender === 'male' ? '男' : '女'}${chart.yinYangGender ? `（${chart.yinYangGender}）` : ''}；國曆 ${b.year}/${b.month}/${b.day}，時辰 ${BRANCHES[b.hour] ?? '?'}時`);
  lines.push(`農曆：${l.lunarYear}年${l.isLeapMonth ? '閏' : ''}${Math.abs(l.lunarMonth)}月${l.lunarDay}日；生年 ${STEMS[l.yearStem]}${BRANCHES[l.yearBranch]}`);
  if (l.fourPillars) lines.push(`四柱：${l.fourPillars.join(' ')}`);
  lines.push(`五行局：${chart.wuxingJuName}；命宮在${BRANCHES[chart.mingGongBranch]}，身宮在${BRANCHES[chart.shenGongBranch]}；命主 ${chart.mingZhu ?? '-'}，身主 ${chart.shenZhu ?? '-'}；目前虛歲約 ${chart.currentAge}`);
  lines.push('');
  lines.push('十二宮（宮名｜干支｜主星｜輔佐煞曜｜大限歲數）：');
  const order = [...chart.palaces].sort((a, c) => ((a.branch - chart.mingGongBranch + 12) % 12) - ((c.branch - chart.mingGongBranch + 12) % 12));
  for (const p of order) {
    const fmt = (s: any) => `${s.name}${s.brightnessRaw ? `(${s.brightnessRaw})` : ''}${s.siHua ? `化${s.siHua}` : ''}`;
    const major = p.stars.filter(s => s.type === 'major').map(fmt).join('、') || (p.borrowedStars?.length ? `空宮（借對宮 ${p.borrowedStars.join('、')}）` : '空宮');
    const others = p.stars.filter(s => s.type !== 'major').map(fmt).join('、') || '—';
    const flags = [p.isMingGong && '命宮', p.isShenGong && '身宮', p.isCurrentDaXian && '目前大限'].filter(Boolean).join('、');
    const self = p.selfSihua?.length ? `；自化：${p.selfSihua.map(s => `${s.starName}化${s.siHua}`).join('、')}` : '';
    lines.push(`- ${p.name}｜${STEMS[p.stem]}${BRANCHES[p.branch]}｜${major}｜${others}｜${p.daXianAge ? `${p.daXianAge[0]}-${p.daXianAge[1]}歲` : ''}${flags ? `｜★${flags}` : ''}${self}`);
  }
  const dx = chart.daXians[chart.currentDaXianIndex];
  if (dx) {
    lines.push('');
    lines.push(`目前大限：${dx.startAge}-${dx.endAge}歲，走${dx.palaceName}${dx.siHua ? `；大限四化 祿${dx.siHua.lu}、權${dx.siHua.quan}、科${dx.siHua.ke}、忌${dx.siHua.ji}` : ''}`);
  }
  try {
    const pats = detectPatterns(chart);
    if (pats.length) {
      lines.push('');
      lines.push('引擎判定的格局：');
      for (const p of pats.slice(0, 12)) lines.push(`- ${p.name}（${p.level}）：${p.description.slice(0, 120)}`);
    }
  } catch { /* 格局判斷失敗時略過 */ }
  return lines.join('\n');
}

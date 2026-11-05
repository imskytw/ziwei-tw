import { getReading, DatasetError, YEAR_MIN, YEAR_MAX } from '@/lib/interp/dataset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/reading?y=1990&m=3&d=8&h=4&g=female → 13 面向解讀（斷語庫，不經 AI） */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const [y, m, d, h] = ['y', 'm', 'd', 'h'].map(k => Number(q.get(k)));
  const g = q.get('g');
  if (![y, m, d, h].every(Number.isInteger) || h < 0 || h > 11 || (g !== 'male' && g !== 'female')) {
    return Response.json({ status: 'error', message: '參數不正確' }, { status: 400 });
  }
  if (y < YEAR_MIN || y > YEAR_MAX) {
    return Response.json({ status: 'out-of-range', message: `斷語庫只涵蓋國曆 ${YEAR_MIN}–${YEAR_MAX} 年出生的命盤，這張盤可以改用 AI 解讀。` });
  }
  try {
    const r = await getReading(y, m, d, h, g);
    if (!r) return Response.json({ status: 'not-found', message: '斷語庫裡找不到這張盤（日期可能不存在）。' });
    return Response.json({ status: 'ok', ...r });
  } catch (e) {
    const message = e instanceof DatasetError ? e.message : '讀取斷語庫時發生錯誤，請稍後再試。';
    if (!(e instanceof DatasetError)) console.error('[reading]', e);
    return Response.json({ status: 'error', message }, { status: 500 });
  }
}

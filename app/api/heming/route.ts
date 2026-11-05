import { streamChat, sseResponse } from '@/lib/llm/providers';
import { chartToText } from '@/lib/llm/chart-text';
import { HEMING_SYSTEM } from '@/lib/llm/prompts';
import { HEMING_METHODOLOGY } from '@/lib/ziwei/heming-knowledge';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { chartA?: ZiweiChart; chartB?: ZiweiChart; question?: string };
  try { body = await req.json(); } catch { return new Response('bad request', { status: 400 }); }
  if (!body.chartA?.palaces || !body.chartB?.palaces) return new Response('missing charts', { status: 400 });

  const system = `${HEMING_SYSTEM}\n\n【合盤方法論】\n${HEMING_METHODOLOGY}\n\n${chartToText(body.chartA, '甲方命盤')}\n\n${chartToText(body.chartB, '乙方命盤')}`;
  const q = body.question?.trim() || '請完整分析我們兩人的合盤：整體契合度、感情與相處模式、可能的衝突點，以及具體的經營建議。';
  return sseResponse(streamChat(system, [{ role: 'user', content: q }], 6000));
}

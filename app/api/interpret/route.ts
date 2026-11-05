import { streamChat, sseResponse, type ChatMessage } from '@/lib/llm/providers';
import { chartToText } from '@/lib/llm/chart-text';
import { INTERPRET_SYSTEM } from '@/lib/llm/prompts';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { chart?: ZiweiChart; messages?: ChatMessage[] };
  try { body = await req.json(); } catch { return new Response('bad request', { status: 400 }); }
  if (!body.chart?.palaces) return new Response('missing chart', { status: 400 });

  let chartText: string;
  try { chartText = chartToText(body.chart); } catch { chartText = JSON.stringify(body.chart).slice(0, 40000); }

  const system = `${INTERPRET_SYSTEM}\n\n${chartText}`;
  return sseResponse(streamChat(system, body.messages ?? []));
}

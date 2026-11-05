import { resolveConfig } from '@/lib/llm/providers';

export const dynamic = 'force-dynamic';

/** 給前端顯示目前串接哪一家 AI（不會回傳金鑰） */
export async function GET() {
  const c = resolveConfig();
  return Response.json({ provider: c.id, label: c.label, model: c.model, ready: c.ready, problem: c.problem ?? null });
}

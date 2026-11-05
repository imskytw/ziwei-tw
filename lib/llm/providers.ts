import 'server-only';

/**
 * 多家 LLM 串接層。
 * 在 .env.local 用 AI_PROVIDER 選擇：openai | anthropic | gemini | deepseek | ollama | custom
 * 金鑰用各家的變數（OPENAI_API_KEY 等）；模型與網址可用 AI_MODEL、AI_BASE_URL 覆寫，見 .env.example。
 */

export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'ollama' | 'custom';

export interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface ProviderInfo {
  label: string;
  kind: 'openai' | 'anthropic';
  baseUrl: string;
  model: string;
  keyEnv: string;
  needsKey: boolean;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  openai:    { label: 'ChatGPT（OpenAI）',  kind: 'openai',    baseUrl: 'https://api.openai.com/v1', model: 'gpt-6.1-sol', keyEnv: 'OPENAI_API_KEY', needsKey: true },
  anthropic: { label: 'Claude（Anthropic）', kind: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-sonnet-5-5', keyEnv: 'ANTHROPIC_API_KEY', needsKey: true },
  gemini:    { label: 'Gemini（Google）',   kind: 'openai',    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.8-flash', keyEnv: 'GEMINI_API_KEY', needsKey: true },
  deepseek:  { label: 'DeepSeek',           kind: 'openai',    baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', keyEnv: 'DEEPSEEK_API_KEY', needsKey: true },
  ollama:    { label: 'Ollama（本機模型，免費）', kind: 'openai', baseUrl: 'http://localhost:11434/v1', model: 'qwen3', keyEnv: 'OLLAMA_API_KEY', needsKey: false },
  custom:    { label: '其他 OpenAI 相容服務', kind: 'openai',  baseUrl: '', model: '', keyEnv: 'CUSTOM_API_KEY', needsKey: false },
};

export interface ResolvedConfig {
  id: ProviderId;
  label: string;
  kind: 'openai' | 'anthropic';
  baseUrl: string;
  model: string;
  apiKey: string;
  ready: boolean;
  problem?: string;
}

const isPlaceholder = (v?: string) => !v || /^your-|^sk-xxx|^在這裡/i.test(v.trim());

export function resolveConfig(): ResolvedConfig {
  const raw = (process.env.AI_PROVIDER || 'openai').trim().toLowerCase();
  const alias: Record<string, ProviderId> = { chatgpt: 'openai', claude: 'anthropic', google: 'gemini' };
  const id = (alias[raw] ?? raw) as ProviderId;
  const p = PROVIDERS[id];
  if (!p) {
    return { id: 'openai', label: raw, kind: 'openai', baseUrl: '', model: '', apiKey: '', ready: false,
      problem: `AI_PROVIDER=${raw} 不是支援的選項，請改成 openai、anthropic、gemini、deepseek、ollama 或 custom。` };
  }
  // 用專案專屬的 AI_MODEL / AI_BASE_URL，避免跟電腦上其他工具設定的環境變數撞名
  const apiKey = (process.env[p.keyEnv] || '').trim();
  const baseUrl = (process.env.AI_BASE_URL || p.baseUrl).trim().replace(/\/+$/, '');
  const model = (process.env.AI_MODEL || p.model).trim();
  let problem: string | undefined;
  if (p.needsKey && isPlaceholder(apiKey)) problem = `尚未設定 ${p.label} 的金鑰：請在 .env.local 填入 ${p.keyEnv}，存檔後重新啟動。`;
  else if (!baseUrl) problem = '請在 .env.local 設定 AI_BASE_URL（服務的網址）。';
  else if (!model) problem = '請在 .env.local 設定 AI_MODEL（模型名稱）。';
  return { id, label: p.label, kind: p.kind, baseUrl, model, apiKey: isPlaceholder(apiKey) ? '' : apiKey, ready: !problem, problem };
}

/** 整理對話：只留 user/assistant、合併相鄰同角色、確保以 user 開頭 */
function normalize(messages: ChatMessage[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of messages) {
    if ((m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' || !m.content.trim()) continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += '\n\n' + m.content;
    else out.push({ role: m.role, content: m.content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out.slice(-20);
}

/** 逐行讀取 SSE 串流，回傳每一行 data: 的內容 */
async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.replace(/\r$/, '');
      if (line.startsWith('data:')) yield line.slice(5).trim();
    }
  }
}

export class ProviderError extends Error {}

/** 串流產生文字片段 */
export async function* streamChat(system: string, messages: ChatMessage[], maxTokens = 4000): AsyncGenerator<string> {
  const cfg = resolveConfig();
  if (!cfg.ready) throw new ProviderError(cfg.problem);
  const msgs = normalize(messages);
  if (!msgs.length) throw new ProviderError('沒有收到問題內容。');

  let res: Response;
  try {
    if (cfg.kind === 'anthropic') {
      res = await fetch(`${cfg.baseUrl}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, system, messages: msgs, stream: true }),
      });
    } else {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (cfg.apiKey) headers.authorization = `Bearer ${cfg.apiKey}`;
      res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: cfg.model, stream: true, messages: [{ role: 'system', content: system }, ...msgs] }),
      });
    }
  } catch (e) {
    const hint = cfg.id === 'ollama' ? '請確認 Ollama 已經開啟（終端機執行 ollama serve）。' : '請檢查網路連線。';
    throw new ProviderError(`連不上 ${cfg.label}。${hint}`);
  }

  if (!res.ok || !res.body) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    console.error(`[llm] ${cfg.id} HTTP ${res.status}: ${detail}`);
    const reason =
      res.status === 401 || res.status === 403 ? '金鑰不正確或沒有權限' :
      res.status === 404 ? `找不到模型「${cfg.model}」，請確認模型名稱` :
      res.status === 429 ? '用量超過上限或帳戶餘額不足' :
      res.status === 402 ? '帳戶餘額不足' : `服務回應錯誤（${res.status}）`;
    throw new ProviderError(`${cfg.label}：${reason}。`);
  }

  for await (const data of sseData(res.body)) {
    if (!data || data === '[DONE]') continue;
    let j: any;
    try { j = JSON.parse(data); } catch { continue; }
    if (cfg.kind === 'anthropic') {
      if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta' && j.delta.text) yield j.delta.text;
      else if (j.type === 'error') throw new ProviderError(`${cfg.label}：${j.error?.message ?? '發生錯誤'}`);
    } else {
      const t = j.choices?.[0]?.delta?.content;
      if (t) yield t;
    }
  }
}

/** 包成前端看得懂的 SSE：data: {"delta":{"text":"..."}} ... data: [DONE] */
export function sseResponse(gen: AsyncGenerator<string>): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => controller.enqueue(enc.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`));
      try {
        for await (const t of gen) send(t);
      } catch (e) {
        const msg = e instanceof ProviderError ? e.message : '連線中斷，請稍後再試。';
        if (!(e instanceof ProviderError)) console.error('[llm] stream error', e);
        send(`\n\n⚠️ ${msg}`);
      } finally {
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' },
  });
}

'use client';
/**
 * 解讀面板：兩個分頁
 *  - 斷語解讀：查「紫微斗數開源解讀數據集 v4.0」（不經 AI、不需金鑰），13 個面向
 *  - AI 問答：原本的 InsightPanel（需要在 .env.local 設定 AI）
 */
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import InsightPanel, { AiContent } from './InsightPanel';

const TOPICS: { key: string; label: string; palace: string[] }[] = [
  { key: 'overview', label: '命格總覽', palace: ['命宮'] },
  { key: 'personality', label: '性格', palace: [] },
  { key: 'love', label: '感情', palace: ['夫妻'] },
  { key: 'career', label: '事業', palace: ['官祿'] },
  { key: 'wealth', label: '財運', palace: ['財帛'] },
  { key: 'health', label: '健康', palace: ['疾厄'] },
  { key: 'family', label: '兄弟', palace: ['兄弟'] },
  { key: 'children', label: '子女', palace: ['子女'] },
  { key: 'move', label: '遷移', palace: ['遷移'] },
  { key: 'friends', label: '交友', palace: ['僕役', '交友'] },
  { key: 'home', label: '田宅', palace: ['田宅'] },
  { key: 'spirit', label: '福德', palace: ['福德'] },
  { key: 'parents', label: '父母', palace: ['父母'] },
];

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; topics: Record<string, string> }
  | { kind: 'info'; message: string }
  | { kind: 'error'; message: string };

export default function ReadingPanel({ chart, selectedPalace }: { chart: ZiweiChart; selectedPalace?: Palace | null }) {
  const [tab, setTab] = useState<'reading' | 'ai'>('reading');
  const [topic, setTopic] = useState('overview');
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [aiPrompt, setAiPrompt] = useState<string | undefined>(undefined);
  const [aiKey, setAiKey] = useState(0);
  const [slow, setSlow] = useState(false);

  const b = chart.birthInfo;
  const url = useMemo(() => `/api/reading?y=${b.year}&m=${b.month}&d=${b.day}&h=${b.hour}&g=${b.gender}`, [b.year, b.month, b.day, b.hour, b.gender]);

  useEffect(() => {
    let alive = true;
    setState({ kind: 'loading' }); setSlow(false);
    const t = setTimeout(() => alive && setSlow(true), 1500);
    fetch(url).then(r => r.json()).then(j => {
      if (!alive) return;
      if (j.status === 'ok') setState({ kind: 'ok', topics: j.topics });
      else if (j.status === 'out-of-range' || j.status === 'not-found') { setState({ kind: 'info', message: j.message }); }
      else setState({ kind: 'error', message: j.message || '讀取失敗' });
    }).catch(() => alive && setState({ kind: 'error', message: '連不上本機伺服器，請確認終端機視窗還開著。' }))
      .finally(() => clearTimeout(t));
    return () => { alive = false; clearTimeout(t); };
  }, [url]);

  // 點命盤上的宮位 → 跳到對應面向
  useEffect(() => {
    if (!selectedPalace || tab !== 'reading') return;
    const name = selectedPalace.name.replace(/宮$/, '');
    const hit = TOPICS.find(t => t.palace.some(p => p.replace(/宮$/, '') === name));
    if (hit) setTopic(hit.key);
  }, [selectedPalace, tab]);

  const askAi = () => {
    const label = TOPICS.find(t => t.key === topic)?.label ?? '';
    setAiPrompt(`請根據我的命盤，針對「${label}」做更深入、更貼近我目前大限與流年的解讀，並給我具體可以做的建議。`);
    setAiKey(k => k + 1);
    setTab('ai');
  };

  const text = state.kind === 'ok' ? state.topics[topic] : '';

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden card-glass" style={{ minHeight: 560 }}>
      {/* 分頁 */}
      <div className="flex-shrink-0 flex gap-1 p-1.5 m-2.5 mb-0 rounded-xl" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }} role="tablist">
        {([['reading', '斷語解讀', '免費・不需 AI'], ['ai', 'AI 問答', '可自由追問']] as const).map(([k, label, sub]) => {
          const on = tab === k;
          return (
            <button key={k} role="tab" aria-selected={on} onClick={() => setTab(k)}
              className="flex-1 rounded-lg py-2 transition-colors duration-200"
              style={{ background: on ? 'var(--t-card-strong)' : 'transparent', color: on ? 'var(--t-gold)' : 'var(--t-faint)', boxShadow: on ? 'var(--sh-xs)' : 'none' }}>
              <div className="text-[13px] font-semibold tracking-wide">{label}</div>
              <div className="text-[13px] opacity-70 mt-0.5">{sub}</div>
            </button>
          );
        })}
      </div>

      {tab === 'ai' ? (
        <div className="flex-1 min-h-0 p-2.5">
          <InsightPanel key={aiKey} chart={chart} selectedPalace={selectedPalace} initialPrompt={aiPrompt} />
        </div>
      ) : (
        <>
          {/* 13 面向 */}
          <div className="flex-shrink-0 px-2.5 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map(t => {
                const on = topic === t.key;
                return (
                  <button key={t.key} onClick={() => setTopic(t.key)}
                    className="px-3.5 min-h-[40px] rounded-full text-[15px] transition-colors duration-150 active:scale-[0.97]"
                    style={{
                      background: on ? 'var(--ac-bg)' : 'transparent',
                      border: `1px solid ${on ? 'var(--t-border-acc)' : 'var(--t-border)'}`,
                      color: on ? 'var(--t-gold)' : 'var(--t-text2)',
                    }}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 內容 */}
          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-6 sm:px-8" style={{ maxHeight: 780 }}>
            {state.kind === 'loading' && (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 h-1 w-32 overflow-hidden rounded-full" style={{ background: 'var(--t-border)' }}>
                  <motion.div className="h-full w-1/3 rounded-full" style={{ background: 'var(--t-gold)' }}
                    animate={{ x: ['-100%', '300%'] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }} />
                </div>
                <p className="text-[15px]" style={{ color: 'var(--t-faint)' }}>正在查斷語庫…</p>
                {slow && (
                  <p className="text-[14px] mt-2 leading-relaxed" style={{ color: 'var(--t-faint)', opacity: 0.8 }}>
                    第一次查 {b.year} 年出生的盤，需要下載約 2 MB 的資料並整理，<br />大約 5–10 秒，之後就會秒開。
                  </p>
                )}
              </div>
            )}
            {(state.kind === 'info' || state.kind === 'error') && (
              <div className="py-8 text-center">
                <p className="text-[13px] leading-relaxed" style={{ color: state.kind === 'error' ? '#f87171' : 'var(--t-text2)' }}>{state.message}</p>
                <button onClick={() => { setAiPrompt(undefined); setAiKey(k => k + 1); setTab('ai'); }}
                  className="mt-4 text-[15px] px-5 min-h-[44px] rounded-full" style={{ border: '1px solid var(--t-border-acc)', color: 'var(--t-gold)' }}>
                  改用 AI 解讀
                </button>
              </div>
            )}
            <AnimatePresence mode="wait">
              {state.kind === 'ok' && (
                <motion.div key={topic} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  {text ? <AiContent text={text} size="md" /> : <p className="text-[15px]" style={{ color: 'var(--t-faint)' }}>這個面向沒有內容。</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 底部 */}
          <div className="flex-shrink-0 px-3 py-2.5 flex items-center gap-2" style={{ borderTop: '1px solid var(--t-border)' }}>
            <p className="flex-1 text-[13px] leading-snug" style={{ color: 'var(--t-faint)' }}>
              內容來自<a href="https://github.com/Renhuai123/ziwei-doushu/releases/tag/v4.0-13d" target="_blank" rel="noreferrer" className="underline underline-offset-2">紫微斗數開源解讀數據集 v4.0</a>（王多魚AI，CC BY 4.0），已轉為繁體
            </p>
            {state.kind === 'ok' && (
              <button onClick={askAi} className="flex-shrink-0 text-[15px] px-4 min-h-[44px] rounded-full transition-transform active:scale-[0.97]"
                style={{ background: 'var(--ac-bg)', border: '1px solid var(--t-border-acc)', color: 'var(--t-gold)' }}>
                請 AI 深入解讀
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

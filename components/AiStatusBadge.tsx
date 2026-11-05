'use client';
import { useEffect, useState } from 'react';

interface Status { label: string; model: string; ready: boolean; problem: string | null }

/** 顯示目前串接哪一家 AI；尚未設定時提示去哪裡設定 */
export default function AiStatusBadge() {
  const [s, setS] = useState<Status | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    fetch('/api/llm-status').then(r => r.ok ? r.json() : null).then(setS).catch(() => setS(null));
  }, []);
  if (!s) return null;
  const color = s.ready ? '#10b981' : '#f59e0b';
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title={s.ready ? `模型：${s.model}` : s.problem ?? ''}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '8px 14px',
          borderRadius: 0, border: 0, fontFamily: 'inherit',
          background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 99, background: color }} />
        <span className="hidden sm:inline">{s.ready ? `AI：${s.label}` : 'AI 尚未設定'}</span>
        <span className="sm:hidden">AI</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 60, width: 'min(280px, 86vw)',
          padding: '14px 16px', borderRadius: 4, fontSize: 14, lineHeight: 1.7,
          background: 'var(--surface-2)', color: 'var(--ink)', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.45)',
        }}>
          {s.ready ? (
            <>目前使用 <b>{s.label}</b><br />模型：<code>{s.model}</code><br /><span style={{ opacity: 0.7 }}>要換別家 AI：修改專案資料夾裡的 .env.local，再重新啟動。</span></>
          ) : (
            <>{s.problem}<br /><span style={{ opacity: 0.7 }}>排盤不需要 AI；只有「AI 解讀」才需要設定。設定方式見 README。</span></>
          )}
        </div>
      )}
    </div>
  );
}

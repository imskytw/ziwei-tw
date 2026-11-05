'use client';

/**
 * 古籍庫搜尋框 — client component
 *
 * 輸入 → 實時搜尋 → 跳轉 /library/search?q=xxx
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function LibrarySearch() {
  const [q, setQ] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    const query = q.trim();
    if (!query) return;
    startTransition(() => {
      router.push(`/library/search?q=${encodeURIComponent(query)}`);
    });
  };

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '6px',
      background: 'var(--bg-card)',
      border: '1px solid rgba(184,146,42,0.3)',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(184,146,42,0.08)',
    }}>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="搜尋古籍原文，如：七殺朝斗 / 雙祿朝垣 / 化忌"
        style={{
          flex: 1,
          padding: '10px 14px',
          border: 'none',
          outline: 'none',
          fontSize: '16px',
          color: 'var(--tx-0)',
          background: 'transparent',
        }}
      />
      <button
        type="button"
        className="btn"
        onClick={submit}
        disabled={isPending || !q.trim()}
      >
        {isPending ? '…' : '搜尋'}
      </button>
    </div>
  );
}

'use client';
import { useState } from 'react';

export interface AgendaQuote { q: string; c: string; p: number; t: number }
const fmt = (t: number) => [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map(n => String(n).padStart(2, '0')).join(':');

export default function QuoteAgenda({ tabs }: { tabs: { book: string; total: number; quotes: AgendaQuote[] }[] }) {
  const [i, setI] = useState(0);
  const cur = tabs[i];
  return (
    <div className="agenda__body">
      <div className="agenda__tabs" role="tablist" aria-label="倪師原話分類">
        {tabs.map((t, k) => (
          <button key={t.book} role="tab" aria-selected={k === i} onClick={() => setI(k)}>
            {t.book}<small>{t.total} 條</small>
          </button>
        ))}
      </div>
      <ol className="agenda__bands" role="tabpanel" aria-label={cur.book}>
        {cur.quotes.map((q, k) => (
          <li key={cur.book + k}>
            <time>{fmt(q.t)}</time>
            <div><q>{q.q}</q><span className="where">{q.c}</span></div>
            <a href={`https://www.bilibili.com/video/BV1KJsLekEfA?p=${q.p}&t=${q.t}`} target="_blank" rel="noreferrer">第 {q.p} 集</a>
          </li>
        ))}
      </ol>
    </div>
  );
}

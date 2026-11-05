'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Quote } from '@/lib/tianji';

const quoteUrl = (q: Quote) => `https://www.bilibili.com/video/BV1KJsLekEfA?p=${q.p}&t=${q.t}`;
const fmt = (t: number) => [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map(n => String(n).padStart(2, '0')).join(':');
const PAGE = 60;

function highlight(text: string, kw: string) {
  if (!kw) return text;
  const parts = text.split(kw);
  return parts.flatMap((p, i) => (i === 0 ? [p] : [<mark key={i} className="quote-mark">{kw}</mark>, p]));
}

export default function QuotesBrowser({ quotes, books }: { quotes: Quote[]; books: string[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const [book, setBook] = useState(sp.get('b') ?? '');
  const [chapter, setChapter] = useState(sp.get('c') ?? '');
  const [kw, setKw] = useState(sp.get('q') ?? '');
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    const q = new URLSearchParams();
    if (book) q.set('b', book); if (chapter) q.set('c', chapter); if (kw) q.set('q', kw);
    router.replace(`/quotes${q.size ? `?${q}` : ''}`, { scroll: false });
    setLimit(PAGE);
  }, [book, chapter, kw, router]);

  const chapters = useMemo(() => {
    if (!book) return [];
    const seen = new Map<string, number>();
    for (const q of quotes) if (q.b === book) seen.set(q.c, (seen.get(q.c) ?? 0) + 1);
    return [...seen.entries()];
  }, [book, quotes]);

  const list = useMemo(() => {
    const k = kw.trim();
    return quotes.filter(q => (!book || q.b === book) && (!chapter || q.c === chapter) && (!k || q.q.includes(k) || q.c.includes(k) || q.s.includes(k)));
  }, [quotes, book, chapter, kw]);

  // 依章節分組顯示
  const shown = list.slice(0, limit);
  const groups: { title: string; items: Quote[] }[] = [];
  for (const q of shown) {
    const title = `${q.b} › ${q.c}`;
    if (groups.at(-1)?.title !== title) groups.push({ title, items: [] });
    groups.at(-1)!.items.push(q);
  }

  return (
    <main className="content-page">
      <div className="content-hero">
        <p className="eyebrow">天紀 · 紫微斗數</p>
        <h1>倪師原話</h1>
        <p className="lede">倪海廈先生《天紀》課程裡講紫微斗數的原話，共 {quotes.length.toLocaleString()} 條。每條都附影片時間，點一下就能回到原影片的那一秒核對。</p>
      </div>

      <div className="quote-tools">
        <input className="field" type="search" value={kw} onChange={e => setKw(e.target.value)} placeholder="搜尋原話，例如：化忌、夫妻宮、晚婚" aria-label="搜尋倪師原話" />
        <div className="chip-row" role="tablist" aria-label="分類">
          <button className={`chip ${!book ? 'is-on' : ''}`} onClick={() => { setBook(''); setChapter(''); }}>全部</button>
          {books.map(b => (
            <button key={b} className={`chip ${book === b ? 'is-on' : ''}`} onClick={() => { setBook(b); setChapter(''); }}>{b}</button>
          ))}
        </div>
        {chapters.length > 1 && (
          <div className="chip-row chip-row--sub">
            <button className={`chip chip--sm ${!chapter ? 'is-on' : ''}`} onClick={() => setChapter('')}>全部章節</button>
            {chapters.map(([c, n]) => (
              <button key={c} className={`chip chip--sm ${chapter === c ? 'is-on' : ''}`} onClick={() => setChapter(c)}>{c}<span className="chip__count">{n}</span></button>
            ))}
          </div>
        )}
        <p className="result-count">共 {list.length.toLocaleString()} 條</p>
      </div>

      <div className="quote-list">
        {groups.map((g, gi) => (
          <section key={gi + g.title} className="quote-group">
            <h2>{g.title}</h2>
            <ol>
              {g.items.map((q, i) => (
                <li key={i} className="quote-item">
                  <blockquote>「{highlight(q.q, kw.trim())}」</blockquote>
                  <div className="quote-meta">
                    {q.s && <span>{q.s}</span>}
                    <a href={quoteUrl(q)} target="_blank" rel="noreferrer" title="在 B 站開啟原影片">▶ 第 {q.p} 集 {fmt(q.t)}</a>
                    {q.n && <span className="quote-note">〔{q.n}〕</span>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
        {list.length === 0 && <p className="empty">找不到符合的原話，換個關鍵字試試。</p>}
        {list.length > limit && (
          <button className="btn-ghost load-more" onClick={() => setLimit(l => l + PAGE * 2)}>再顯示 {Math.min(PAGE * 2, list.length - limit)} 條</button>
        )}
      </div>

      <footer className="content-foot">
        倪海廈《天紀》課程原話，整理自 <a href="https://github.com/Renhuai123/nihai-tianji-corpus" target="_blank" rel="noreferrer">Renhuai123/nihai-tianji-corpus</a>，
        採 <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a> 授權（不可商用）。原課程著作權屬倪海廈先生及其權利繼承人。
      </footer>
    </main>
  );
}

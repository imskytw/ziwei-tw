import { Fragment, type ReactNode } from 'react';

/**
 * AI 回覆與斷語的閱讀排版（排盤的 AI 問答、合盤分析、斷語解讀共用）。
 *
 * AI 回的是 Markdown，這裡只處理會用到的那幾種：
 * # 標題、**【段落】**、- / 1. 清單、> 引言、| 表格 |、--- 分隔線、**粗體**。
 * 串流中途只來一半的符號也不會壞版：未閉合的 ** 會直接拿掉。
 * 樣式在 app/editorial.css 的 .ai-prose。
 */

type Block =
  | { kind: 'h'; level: number; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: { text: string; depth: number; mark: string }[] }
  | { kind: 'quote'; lines: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'hr' };

function inline(text: string): ReactNode {
  // 串流中途可能只有開頭的 **，先拿掉落單的符號
  const pairs = (text.match(/\*\*/g) || []).length;
  let t = pairs % 2 ? text.replace(/\*\*(?!.*\*\*)/, '') : text;
  t = t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2'); // *斜體* 中文不用斜體，直接去掉符號
  const parts = t.split(/\*\*(.+?)\*\*/);
  return parts.map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>));
}

const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
const isTableSep = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

function parse(text: string): Block[] {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { out.push({ kind: 'hr' }); i++; continue; }

    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push({ kind: 'h', level: Math.min(h[1].length, 4), text: h[2].replace(/\*\*/g, '') }); i++; continue; }
    const boxed = trimmed.match(/^\*\*\s*(【[^】]+】[^*]*)\*\*$/) || trimmed.match(/^(【[^】]+】)$/);
    if (boxed) { out.push({ kind: 'h', level: 2, text: boxed[1].trim() }); i++; continue; }

    // 表格：表頭一行 + 分隔線一行 + 資料列
    if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(trimmed);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(cells(lines[i])); i++; }
      out.push({ kind: 'table', head, rows });
      continue;
    }
    // 串流中只到表頭、分隔線還沒到：先當一般文字，避免閃出一堆直線
    if (/^\|.*\|$/.test(trimmed) && isTableSep(trimmed)) { i++; continue; }

    if (/^>/.test(trimmed)) {
      const q: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      out.push({ kind: 'quote', lines: q });
      continue;
    }

    const li = line.match(/^(\s*)([-*•]|\d+[.、)])\s+(.*)$/);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const items: { text: string; depth: number; mark: string }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*•]|\d+[.、)])\s+(.*)$/);
        if (!m) break;
        items.push({ text: m[3], depth: Math.min(Math.floor(m[1].length / 2), 2), mark: /\d/.test(m[2]) ? m[2].replace(/[、)]/, '.') : '' });
        i++;
      }
      out.push({ kind: ordered ? 'ol' : 'ul', items });
      continue;
    }

    out.push({ kind: 'p', text: trimmed });
    i++;
  }
  return out;
}

export default function AiContent({ text, streaming, size = 'md' }: { text: string; streaming?: boolean; size?: 'sm' | 'md' }) {
  const blocks = parse(text);
  return (
    <div className={`ai-prose ai-prose--${size}`}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h': {
            const Tag = (b.level <= 2 ? 'h3' : 'h4') as 'h3' | 'h4';
            return <Tag key={i}>{inline(b.text)}</Tag>;
          }
          case 'p': return <p key={i}>{inline(b.text)}</p>;
          case 'hr': return <div key={i} className="ai-prose__gap" aria-hidden="true" />;
          case 'quote': return <blockquote key={i}>{b.lines.map((l, j) => <p key={j}>{inline(l)}</p>)}</blockquote>;
          case 'ul':
          case 'ol': {
            const Tag = b.kind;
            return (
              <Tag key={i}>
                {b.items.map((it, j) => (
                  <li key={j} data-depth={it.depth || undefined} data-mark={it.mark || undefined}>{inline(it.text)}</li>
                ))}
              </Tag>
            );
          }
          case 'table':
            return (
              <div key={i} className="ai-prose__table" role="region" aria-label="表格" tabIndex={0}>
                <table>
                  <thead><tr>{b.head.map((c, j) => <th key={j} scope="col">{inline(c)}</th>)}</tr></thead>
                  <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => (k === 0 ? <th key={k} scope="row">{inline(c)}</th> : <td key={k}>{inline(c)}</td>))}</tr>)}</tbody>
                </table>
              </div>
            );
        }
      })}
      {streaming && <span className="ai-prose__caret" aria-hidden="true" />}
    </div>
  );
}

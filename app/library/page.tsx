/**
 * 古籍原典查詢庫 · 主頁
 *
 * 列出所有收錄古籍 + 全域性搜尋入口
 */

import Link from 'next/link';
import { ALL_BOOKS, TOTAL_PARAGRAPHS } from '@/lib/classics';
import LibrarySearch from './LibrarySearch';
import ContentHeader from '@/components/ContentHeader';

export const metadata = {
  title: '倪師方法論 · 古籍原典庫 · 紫微斗數全集 / 全書 / 骨髓賦',
  description: '紫微斗數權威古籍全文檢索：《紫微斗數全集》《紫微斗數全書》《骨髓賦》倪海廈《天紀》引證來源',
};

export default function LibraryHomePage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <ContentHeader current="library" />

      <div className="content-page" style={{ paddingBottom: 0 }}>
        <div className="content-hero">
          <h1>古籍原典</h1>
          <p className="lede">收錄 {ALL_BOOKS.length} 部紫微斗數古籍的重點段落，共 {TOTAL_PARAGRAPHS} 段，可以全文搜尋。想看倪師上課怎麼講，請到 <Link href="/quotes">倪師原話</Link>。</p>
        </div>
      </div>

      {/* 搜尋 */}
      <div className="max-w-2xl mx-auto px-6 mb-12">
        <LibrarySearch />
      </div>

      {/* 古籍列表 */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_BOOKS.map(book => (
            <Link
              key={book.slug}
              href={`/library/${book.slug}`}
              style={{
                display: 'block',
                background: 'var(--bg-card)',
                border: '1px solid rgba(184,146,42,0.2)',
                borderRadius: '14px',
                padding: '24px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(184,146,42,0.06)',
              }}
              className="lib-row"
            >
              <div style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.02em', marginBottom: '6px' }}>
                {book.dynasty} · {book.author.split(' ')[0]}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px', letterSpacing: '0.03em' }}>
                《{book.title}》
              </div>
              <div style={{ fontSize: '15px', color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: '14px' }}>
                {book.intro}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: 'var(--tx-3)' }}>
                <span>{book.chapters.length} 章節</span>
                <span style={{ color: 'rgba(184,146,42,0.4)' }}>·</span>
                <span>{book.chapters.reduce((s, c) => s + c.paragraphs.length, 0)} 段精華</span>
              </div>
              <div style={{
                display: 'inline-flex',
                marginTop: '14px',
                fontSize: '14px',
                color: 'var(--ac)',
                letterSpacing: '0.04em',
                fontWeight: 500,
              }}>
                進入查閱 →
              </div>
            </Link>
          ))}
        </div>

        {/* 底部說明 */}
        <div style={{ marginTop: '60px', padding: '24px', background: 'rgba(184,146,42,0.05)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: 'var(--ac-dim)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            關於本庫
          </div>
          <div style={{ fontSize: '15px', color: 'var(--tx-2)', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto' }}>
            所收錄古籍均為公版（明代刊本）。<br />
            內容持續完善，未來將補全《紫微斗數全集》全本與倪海廈《天紀》引證目錄。<br />
            如發現任何錯誤請聯絡我們。
          </div>
        </div>
      </div>
    </div>
  );
}

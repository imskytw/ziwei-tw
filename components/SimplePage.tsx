import { SITE_NAME } from '@/lib/site';

/** 條款、隱私等純文字頁的共用外框 */
export default function SimplePage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span><span>返回首頁</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>{SITE_NAME}</span>
      </header>
      <main className="simple-page" style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.9, fontSize: 15 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>最後更新：{updated}</p>
        {children}
      </main>
    </>
  );
}

import ContentHeader from '@/components/ContentHeader';

/** 條款、隱私等純文字頁的共用外框 */
export default function SimplePage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <ContentHeader />
      <main className="simple-page" style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.9, fontSize: 15 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>最後更新：{updated}</p>
        {children}
      </main>
    </>
  );
}

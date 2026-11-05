import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

const NAV = [
  { key: 'chart', href: '/chart', label: '排盤' },
  { key: 'heming', href: '/heming', label: '合盤' },
  { key: 'knowledge', href: '/knowledge', label: '百科' },
  { key: 'quotes', href: '/quotes', label: '倪師原話' },
  { key: 'library', href: '/library', label: '古籍' },
];

/** 內容頁共用頂欄 */
export default function ContentHeader({ current, children }: { current?: string; children?: React.ReactNode }) {
  return (
    <header className="site-header">
      <Link href="/" className="site-header__brand">{SITE_NAME}</Link>
      <nav className="site-header__nav" aria-label="主要導覽">
        {NAV.map(n => (
          <Link key={n.key} href={n.href} className={n.key === current ? 'is-active' : undefined} aria-current={n.key === current ? 'page' : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
      {children && <div className="site-header__actions">{children}</div>}
    </header>
  );
}

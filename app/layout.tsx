import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import './editorial.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SITE_URL, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `${SITE_NAME} · 倪海廈正宗紫微斗數`,
  description: '基於倪海廈正宗紫微斗數體系，AI深度解讀您的命盤格局、大限流年、感情事業財富健康全方位解析',
  keywords: '紫微斗數, 倪海廈, 紫微斗數全集, 紫微斗數全書, 骨髓賦, 命盤, 命理, 14主星, 12宮位',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `${SITE_NAME} · 倪海廈正宗紫微斗數`,
    description: '基於倪海廈正宗紫微斗數體系，AI深度解讀您的命盤格局、大限流年、感情事業財富健康全方位解析',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'zh_TW',
    type: 'website',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Iansui&display=swap" />
        <Script id="theme-init" strategy="beforeInteractive">{`(function(){document.documentElement.classList.add('js');try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`}</Script>
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import { Suspense } from 'react';
import QuotesBrowser from '@/components/QuotesBrowser';
import ContentHeader from '@/components/ContentHeader';
import { QUOTES, BOOKS } from '@/lib/tianji';
import { SITE_NAME } from '@/lib/site';

export const metadata = {
  title: `倪師原話 1,848 條 · ${SITE_NAME}`,
  description: '倪海廈《天紀 · 紫微斗數》課程原話，按主星、宮位、四化、格局、看盤方法分類，可搜尋，每條都能跳回原影片時間點核對。',
};

export default function QuotesPage() {
  return (
    <>
      <ContentHeader current="quotes" />
      <Suspense>
        <QuotesBrowser quotes={QUOTES} books={BOOKS} />
      </Suspense>
    </>
  );
}

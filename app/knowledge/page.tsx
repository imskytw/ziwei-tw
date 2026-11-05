/**
 * /knowledge —— 紫微斗數百科
 * 原專案的 14 主星 × 13 宮位詳細斷語沒有開源（STAR_DB 為空），
 * 繁體版改用倪師《天紀》原話 1,848 條作為百科內容：按主星、宮位、四化、格局等分類，點進去看倪師原話。
 * 每張命盤的 13 面向完整解讀，則在排盤頁的「斷語解讀」查（開源解讀數據集 v4.0）。
 */
import Link from 'next/link';
import ContentHeader from '@/components/ContentHeader';
import { categories } from '@/lib/tianji';
import { STAR_BRIEF_SEO } from '@/lib/seo/knowledge';
import { SITE_NAME } from '@/lib/site';

export const metadata = {
  title: `紫微斗數百科 · 倪海廈《天紀》體系 · ${SITE_NAME}`,
  description: '以倪海廈《天紀》課程原話整理的紫微斗數百科：十四主星、十二宮位、四化、格局與看盤方法，每條都能跳回原影片核對。',
};

const BOOK_INTRO: Record<string, string> = {
  主星: '十四主星與重要輔星、煞星的定性',
  宮位: '十二宮各自管什麼、怎麼看',
  四化: '化祿、化權、化科、化忌的意義與倪師立場',
  格局: '成格、破格與經典格局',
  看盤方法: '批命順序、氣色相法、陽宅化命',
  疾病: '命盤與健康、經脈流注',
  占卜: '小六壬等占法',
  風水: '紫微在堪輿中的運用',
  易理: '易經義理',
};

const starName = (chapter: string) => chapter.split('（')[0];

export default function KnowledgeHomePage() {
  const cats = categories();
  return (
    <>
      <ContentHeader current="knowledge" />
      <main className="content-page">
        <div className="content-hero">
          <p className="eyebrow">倪海廈《天紀》體系</p>
          <h1>紫微斗數百科</h1>
          <p className="lede">依倪師課堂原話分類整理。想看自己命盤的完整解讀，請到 <Link href="/chart">排盤</Link> 頁的「斷語解讀」。</p>
        </div>

        {cats.map(cat => (
          <section key={cat.book} className="kb-section">
            <div className="kb-section__head">
              <h2>{cat.book}</h2>
              <p>{BOOK_INTRO[cat.book]} · {cat.total} 條</p>
            </div>
            <div className={cat.book === '主星' ? 'kb-grid kb-grid--stars' : 'kb-grid'}>
              {cat.chapters.map(ch => {
                const brief = cat.book === '主星' ? STAR_BRIEF_SEO[starName(ch.name)] : undefined;
                return (
                  <Link key={ch.name} className="kb-card" href={`/quotes?b=${encodeURIComponent(cat.book)}&c=${encodeURIComponent(ch.name)}`}>
                    <span className="kb-card__title">{ch.name}</span>
                    {brief && <span className="kb-card__brief">{brief}</span>}
                    <span className="kb-card__count">{ch.count} 條原話 →</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}

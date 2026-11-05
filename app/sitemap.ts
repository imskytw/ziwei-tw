/**
 * 自動生成 sitemap.xml
 *
 * 包含：
 *  - 主頁、起盤頁、合盤頁
 *  - /library 古籍庫（主頁 + 3 部古籍 + 章節頁）
 *  - /knowledge 百科、/quotes 倪師原話
 */

import type { MetadataRoute } from 'next';
import { ALL_BOOKS } from '@/lib/classics';
import { SITE_URL } from '@/lib/site';

const BASE_URL = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastmod = new Date('2026-04-28');

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly', lastModified: lastmod },
    { url: `${BASE_URL}/chart`, priority: 0.95, changeFrequency: 'weekly', lastModified: lastmod },
    { url: `${BASE_URL}/heming`, priority: 0.7, changeFrequency: 'weekly', lastModified: lastmod },
    { url: `${BASE_URL}/library`, priority: 0.85, changeFrequency: 'weekly', lastModified: lastmod },
    { url: `${BASE_URL}/knowledge`, priority: 0.9, changeFrequency: 'weekly', lastModified: lastmod },
    { url: `${BASE_URL}/quotes`, priority: 0.85, changeFrequency: 'monthly', lastModified: lastmod },
    { url: `${BASE_URL}/terms`, priority: 0.3, changeFrequency: 'monthly', lastModified: lastmod },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: 'monthly', lastModified: lastmod },
  ];

  // 古籍頁
  const libraryPages: MetadataRoute.Sitemap = ALL_BOOKS.flatMap(book => {
    const bookHome: MetadataRoute.Sitemap[number] = {
      url: `${BASE_URL}/library/${book.slug}`,
      priority: 0.75,
      changeFrequency: 'monthly',
      lastModified: lastmod,
    };
    const chapters: MetadataRoute.Sitemap = book.chapters.map((_, i) => ({
      url: `${BASE_URL}/library/${book.slug}/${i}`,
      priority: 0.7,
      changeFrequency: 'monthly',
      lastModified: lastmod,
    }));
    return [bookHome, ...chapters];
  });

  return [...staticPages, ...libraryPages];
}

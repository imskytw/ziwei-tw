import SimplePage from '@/components/SimplePage';
import { SITE_NAME, UPSTREAM_URL } from '@/lib/site';

export const metadata = { title: `使用說明與條款 · ${SITE_NAME}` };

const h2 = { fontSize: 18, marginTop: 32, marginBottom: 10 } as const;

export default function TermsPage() {
  return (
    <SimplePage title="使用說明與條款" updated="2026 年 11 月">
      <h2 style={h2}>1. 內容性質</h2>
      <p>{SITE_NAME}依倪海廈《天紀》紫微斗數體系排盤，並可串接 AI 產生解讀。所有命理內容僅供文化研究與自我探索參考，<strong>不構成醫療、投資、法律、心理諮詢或任何重大決策建議</strong>。</p>

      <h2 style={h2}>2. AI 解讀</h2>
      <p>AI 解讀由架設者自行選擇的第三方 AI 服務（例如 ChatGPT、Claude、Gemini）產生，內容可能有誤，請自行判斷。使用 AI 時，命盤資料與你的提問會傳送給該 AI 服務，並依該服務的條款處理。</p>

      <h2 style={h2}>3. 開源授權與來源</h2>
      <p>本站改作自開源專案 <a href={UPSTREAM_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--ac)' }}>Renhuai123/ziwei-doushu</a>（作者：王多魚AI）。程式碼依 MIT 授權使用；樣本與解讀數據集依 CC BY 4.0 授權，使用時須保留來源標註；古籍原文屬公有領域。倪海廈先生本人與本站無任何關聯。</p>

      <h2 style={h2}>4. 免責</h2>
      <p>本站依「現狀」提供，不保證排盤或解讀完全正確。架設者可依自身需求修改本頁內容。</p>
    </SimplePage>
  );
}

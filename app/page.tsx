/**
 * 首頁 ——「印刷年報」方向（design-taste-frontend：editorial-report，seed 1822962612）
 * 概念：「紫微」原是北極周圍的星官紫微垣，刻在蘇州石刻天文圖上；報頭用這張天文圖，
 * 互動則是「你出生那天台灣有沒有夏令時間」。
 */
import Link from 'next/link';
import Reveal from '@/components/home/Reveal';
import ThemeButton from '@/components/home/ThemeButton';
import DstChecker from '@/components/home/DstChecker';
import QuoteAgenda, { type AgendaQuote } from '@/components/home/QuoteAgenda';
import { QUOTES } from '@/lib/tianji';
import { IMAGE_CREDITS } from '@/lib/credits';
import { SITE_NAME, AUTHOR, REPO_URL, UPSTREAM_URL } from '@/lib/site';

const NAV = [
  { href: '/chart', label: '排盤' },
  { href: '/heming', label: '合盤' },
  { href: '/knowledge', label: '百科' },
  { href: '/quotes', label: '倪師原話' },
  { href: '/library', label: '古籍' },
];

function agendaTabs() {
  const books = ['主星', '宮位', '四化', '格局', '看盤方法'];
  return books.map(book => {
    const all = QUOTES.filter(q => q.b === book);
    const seen = new Set<string>();
    const picks: AgendaQuote[] = [];
    for (const q of all) {
      if (q.q.length < 14 || q.q.length > 42 || seen.has(q.c)) continue;
      seen.add(q.c);
      picks.push({ q: q.q, c: q.c, p: q.p, t: q.t });
      if (picks.length === 5) break;
    }
    return { book, total: all.length, quotes: picks };
  });
}

function Img({ src, alt, className, eager }: { src: string; alt: string; className?: string; eager?: boolean }) {
  return (
    <img
      className={className}
      src={`/images/${src}-1600.webp`}
      srcSet={`/images/${src}-900.webp 900w, /images/${src}-1600.webp 1600w`}
      sizes="(max-width: 820px) 100vw, 66vw"
      alt={alt}
      width={1600}
      height={672}
      loading={eager ? undefined : 'lazy'}
      decoding="async"
    />
  );
}
const pic = (name: string, w: number) => `/images/${name}-${w}.webp`;

export default function HomePage() {
  const tabs = agendaTabs();
  const markLen = Math.max(SITE_NAME.length, 1);

  return (
    <div className="home">
      <Reveal />

      {/* ── 首屏 ── */}
      <section className="hero" aria-labelledby="hero-title">
        <header className="hero__top">
          <Link href="/" className="hero__wordmark" aria-label={`${SITE_NAME} 首頁`}>{SITE_NAME}</Link>
          <nav className="hero__nav" aria-label="主要導覽">
            {NAV.map(n => <Link key={n.href} href={n.href}>{n.label}</Link>)}
            <ThemeButton />
          </nav>
        </header>
        <div className="hero__talk">
          <p className="hero__lede">依倪海廈《天紀》體系排盤。免費、開源，裝在你自己的電腦上。</p>
          <p className="hero__note">支援台灣夏令時間與 368 個鄉鎮的真太陽時。排完盤就有 13 個面向的完整解讀，不需要 AI。</p>
          <Link href="/chart" className="btn">開始排盤</Link>
        </div>
        <div className="hero__main">
          <h1 id="hero-title" className="hero__title">
            <span className="line"><span>排出你的</span></span>
            <span className="line"><span>紫微命盤</span></span>
          </h1>
        </div>
        <div className="hero__badge">
          <strong>674,976</strong>
          <span>張命盤的完整斷語，涵蓋國曆 1950–2026 年出生的每一天、每個時辰</span>
        </div>
        <div className="hero__figure">
          <Img src="masthead-soochow" alt="蘇州石刻天文圖拓本的中心，北極周圍的星官就是紫微垣" eager />
        </div>
      </section>

      {/* ── 一套免費的紫微斗數 ── */}
      <section className="sec intro" aria-labelledby="intro-title">
        <div className="intro__row" data-reveal>
          <h2 id="intro-title"><span className="nw">一套免費的</span><span className="nw">紫微斗數</span></h2>
          <p>原專案開源了排盤引擎與斷語數據集。這個版本把它轉成繁體中文，補上台灣的夏令時間與鄉鎮經度，並讓你自己選要串接哪一家 AI。</p>
        </div>
        <div className="facts" data-reveal>
          <div><strong>674,976</strong><span>張命盤的 13 面向斷語</span></div>
          <div><strong>1,848</strong><span>條倪師《天紀》原話</span></div>
          <div><strong>368</strong><span>個台灣鄉鎮市區的經度</span></div>
          <div><strong>6</strong><span>種 AI 任你選，也可以不用</span></div>
        </div>
      </section>

      {/* ── 夏令時間 ── */}
      <section className="sec compare" aria-labelledby="dst-title">
        <div className="compare__head" data-reveal>
          <h2 id="dst-title"><span className="nw">差一小時，</span><span className="nw">差一個時辰</span></h2>
          <p>台灣在 1945 到 1979 年間，有好幾段時間實施夏令時間，鐘錶比標準時間快一小時。紫微斗數兩小時一個時辰，出生在時辰交界的人，命宮、身宮和大限都會整個換掉。</p>
        </div>
        <div className="compare__specimens" aria-hidden="true">
          <figure><div className="big">13:30</div><figcaption>出生證明上的鐘錶時間，未時</figcaption></figure>
          <figure><div className="big">12:30</div><figcaption>排盤要用的標準時間，午時</figcaption></figure>
        </div>
        <DstChecker />
      </section>

      {/* ── 功能（整頁色面）── */}
      <section className="features" aria-labelledby="features-title">
        <div className="features__grid">
          <div className="features__title"><h2 id="features-title">打開<br />就能讀</h2></div>
          <div className="features__blocks">
            <article className="feature" data-reveal>
              <h3>斷語解讀，不用 AI</h3>
              <div className="feature__row">
                <img src={pic('dunhuang-ziwei', 800)} alt="敦煌星圖中的紫微宮，北極周圍的星官" width={800} height={803} loading="lazy" />
                <ul>
                  <li>命格、性格、感情、事業、財運、健康</li>
                  <li>兄弟、子女、遷移、交友、田宅、福德、父母</li>
                  <li>每張盤約三萬字，依出生日期與時辰查出</li>
                  <li>點命盤上的宮位，直接跳到那個面向</li>
                  <li>第一次查某一年要下載約 2 MB，之後秒開</li>
                </ul>
              </div>
            </article>
            <article className="feature" data-reveal>
              <h3>AI 問答，你選哪一家</h3>
              <div className="feature__row">
                <img src={pic('dunhuang-chart', 700)} alt="敦煌星圖的一幅，以圓點與連線畫出星官" width={700} height={709} loading="lazy" />
                <ul>
                  <li>ChatGPT、Claude、Gemini、DeepSeek</li>
                  <li>Ollama 本機模型：免費，資料不離開電腦</li>
                  <li>也能接任何 OpenAI 相容的服務</li>
                  <li>金鑰只存在你自己電腦的設定檔裡</li>
                  <li>針對你的大限與流年自由追問</li>
                </ul>
              </div>
            </article>
            <article className="feature" data-reveal>
              <h3>兩個人的合盤</h3>
              <div className="feature__row">
                <img src={pic('planisphere', 800)} alt="蘇州石刻天文圖的圓形星圖局部" width={800} height={800} loading="lazy" />
                <ul>
                  <li>感情、合夥、親子、朋友</li>
                  <li>看夫妻宮、命宮、福德宮的互動</li>
                  <li>一方的化忌落在另一方的哪一宮</li>
                  <li>附相處建議與需要留意的大限</li>
                </ul>
              </div>
            </article>
            <article className="feature" data-reveal>
              <h3>古籍與倪師原話</h3>
              <div className="feature__row">
                <img src={pic('bencao', 600)} alt="明代《本草綱目》初刻本的書頁" width={600} height={808} loading="lazy" />
                <ul>
                  <li><Link href="/library">骨髓賦、紫微斗數全集與全書</Link>節錄，可全文搜尋</li>
                  <li><Link href="/quotes">倪師《天紀》原話 1,848 條</Link></li>
                  <li>每條附影片時間，點了就回到那一秒</li>
                  <li><Link href="/knowledge">百科</Link>依主星、宮位、四化、格局分類</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── 倪師原話 ── */}
      <section className="sec agenda" aria-labelledby="quotes-title">
        <div className="agenda__head" data-reveal>
          <h2 id="quotes-title"><span>倪師怎麼說</span>點時間，回到原影片</h2>
          <Link href="/quotes" className="btn">看全部 1,848 條</Link>
        </div>
        <QuoteAgenda tabs={tabs} />
      </section>

      {/* ── 安裝 ── */}
      <section className="sec" aria-labelledby="install-title">
        <div className="stairs">
          <div data-reveal><h2 id="install-title" className="line">先裝好 Node.js。</h2><p>到 nodejs.org 下載 LTS（長期支援）版本，像一般軟體一樣安裝。</p></div>
          <div data-reveal><p className="line"><span className="nw">再下載</span><span className="nw">這個專案。</span></p><p>在 GitHub 按 Code，選 Download ZIP，解壓縮到任何資料夾。</p></div>
          <div data-reveal><p className="line">雙擊啟動檔。</p><p>Mac 用「啟動紫微斗數.command」，Windows 用「啟動紫微斗數.bat」。第一次會自動安裝。</p></div>
          <div data-reveal><p className="line"><span className="nw">選一家 AI，</span><span className="nw">或跳過。</span></p><p>設定精靈會一步一步問你。不用 AI 也能排盤、看斷語。{REPO_URL ? <> 完整教學見 <a href={REPO_URL}>GitHub</a>。</> : ' 完整教學在專案的 README。'}</p></div>
        </div>
      </section>

      {/* ── 收尾 ── */}
      <section className="cta" aria-labelledby="cta-title">
        <div className="cta__strip" aria-hidden="true">
          <div><img src={pic('soochow-full', 1000)} alt="" width={1000} height={1865} loading="lazy" style={{ objectPosition: '50% 20%' }} /></div>
          <div><img className="turn" src={pic('planisphere', 800)} alt="" width={800} height={800} loading="lazy" /></div>
          <div><img src={pic('dunhuang-ziwei', 800)} alt="" width={800} height={803} loading="lazy" /></div>
        </div>
        <div className="cta__band">
          <div data-reveal>
            <h2 id="cta-title"><span className="nw">你的十二宮，</span><span className="nw">早就在星圖上。</span><span className="nw"><Link href="/chart">現在排一張命盤</Link>。</span></h2>
            <p>排盤在你的瀏覽器裡完成，生日不會上傳到任何資料庫。所有內容僅供文化研究與自我探索參考，不構成醫療、投資或法律建議。</p>
          </div>
        </div>
      </section>

      {/* ── 頁尾 ── */}
      <footer className="foot">
        <div className="foot__cols">
          <ul><li>網站</li>{NAV.map(n => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}</ul>
          <ul><li>說明</li><li><Link href="/terms">使用說明與條款</Link></li><li><Link href="/privacy">隱私說明</Link></li>{REPO_URL && <li><a href={REPO_URL}>安裝教學與原始碼</a></li>}</ul>
          <ul>
            <li>來源與授權</li>
            <li><a href={UPSTREAM_URL}>原專案 Renhuai123/ziwei-doushu</a>，作者王多魚AI，程式碼 MIT</li>
            <li>解讀數據集 v4.0，CC BY 4.0</li>
            <li>倪師原話，CC BY-NC-SA 4.0，不可商用</li>
          </ul>
          <ul><li>繁體改作</li><li>{AUTHOR}</li><li>免費開源，歡迎自行安裝使用</li></ul>
        </div>
        <div />
        <div className="foot__mark">
          <svg viewBox={`0 0 ${markLen * 100} 96`} role="img" aria-label={SITE_NAME}>
            <text x="0" y="86" fontSize="100" fontWeight="400" textLength={markLen * 100} lengthAdjust="spacingAndGlyphs" fontFamily="'Wang XingShu', 'Iansui', serif">{SITE_NAME}</text>
          </svg>
          <p className="foot__legal">
            圖片：{IMAGE_CREDITS.map((c, i) => (
              <span key={c.url}>{i > 0 && '；'}<a href={c.url}>{c.title}</a>，{c.by}，{c.licence}</span>
            ))}，均經 Wikimedia Commons，已轉為雙色處理。字型：標題<a href="https://github.com/cghio/wangfonts">王漢宗中行書繁</a>（GNU GPL），內文<a href="https://github.com/ButTaiwan/iansui">芫荽 Iansui</a>（SIL Open Font License）。倪海廈先生本人與本站無任何關聯。
          </p>
        </div>
      </footer>
    </div>
  );
}

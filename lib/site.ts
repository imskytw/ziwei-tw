/**
 * 站點根地址。部署時在 .env.local 裡配置 NEXT_PUBLIC_SITE_URL（見 .env.example）；
 * 未配置時用本機開發地址，避免 fork 部署後把 sitemap、canonical 指向別人的域名。
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

/** 只取域名部分，用於介面上展示（如分享卡底部） */
/** 站名：在 .env.local 設定 NEXT_PUBLIC_SITE_NAME 就能換成你自己的品牌 */
export const SITE_NAME = (process.env.NEXT_PUBLIC_SITE_NAME || '紫微命盤').trim();

/** 原始開源專案（MIT 授權、數據集 CC BY 4.0，依授權須保留來源標註） */
export const UPSTREAM_URL = 'https://github.com/Renhuai123/ziwei-doushu';

export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');

/** 繁體改作者署名與專案網址（可在 .env.local 覆寫） */
export const AUTHOR = (process.env.NEXT_PUBLIC_AUTHOR || '賀少穎（imsky.tw）').trim();
const DEFAULT_REPO = 'imskytw/ziwei-tw'; // 發布後由 scripts/set-repo.mjs 改成實際位址
export const REPO_URL = (process.env.NEXT_PUBLIC_REPO_URL || (DEFAULT_REPO.startsWith('OWNER/') ? '' : `https://github.com/${DEFAULT_REPO}`)).trim();

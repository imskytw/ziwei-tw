import type { ProvinceInfo } from './cities';

/**
 * 海外出生地（region: 'intl'）。每個城市帶 IANA 時區，當年的時差與夏令時間由 lib/ziwei/tz.ts 自動換算。
 * 經度取市中心，精度 0.01° ≈ 2.4 秒真太陽時。
 */
type C = [name: string, longitude: number, tz?: string];
const country = (name: string, tz: string, cities: C[]): ProvinceInfo => ({
  name, region: 'intl', tz,
  cities: cities.map(([n, lon, t]) => ({ name: n, longitude: lon, ...(t ? { tz: t } : {}) })),
});

export const INTL_PROVINCES: ProvinceInfo[] = [
  country('日本', 'Asia/Tokyo', [['東京', 139.69], ['橫濱', 139.64], ['大阪', 135.5], ['京都', 135.77], ['神戶', 135.2], ['名古屋', 136.91], ['福岡', 130.4], ['札幌', 141.35], ['仙台', 140.87], ['廣島', 132.46], ['那霸（沖繩）', 127.68]]),
  country('韓國', 'Asia/Seoul', [['首爾', 126.98], ['仁川', 126.7], ['釜山', 129.08], ['大邱', 128.6], ['濟州', 126.53]]),
  country('新加坡', 'Asia/Singapore', [['新加坡', 103.82]]),
  country('馬來西亞', 'Asia/Kuala_Lumpur', [['吉隆坡', 101.69], ['檳城', 100.33], ['新山', 103.76], ['怡保', 101.08], ['馬六甲', 102.25], ['古晉', 110.34, 'Asia/Kuching'], ['亞庇', 116.07, 'Asia/Kuching']]),
  country('泰國', 'Asia/Bangkok', [['曼谷', 100.5], ['清邁', 98.99], ['普吉', 98.39]]),
  country('越南', 'Asia/Ho_Chi_Minh', [['胡志明市', 106.66], ['河內', 105.85, 'Asia/Bangkok'], ['峴港', 108.22]]),
  country('菲律賓', 'Asia/Manila', [['馬尼拉', 120.98], ['宿霧', 123.89], ['達沃', 125.61]]),
  country('印尼', 'Asia/Jakarta', [['雅加達', 106.85], ['泗水', 112.75], ['棉蘭', 98.67], ['峇里島', 115.22, 'Asia/Makassar']]),
  country('緬甸', 'Asia/Yangon', [['仰光', 96.16], ['曼德勒', 96.08]]),
  country('柬埔寨', 'Asia/Phnom_Penh', [['金邊', 104.92]]),
  country('印度', 'Asia/Kolkata', [['新德里', 77.21], ['孟買', 72.88], ['班加羅爾', 77.59]]),
  country('阿拉伯聯合大公國', 'Asia/Dubai', [['杜拜', 55.27], ['阿布達比', 54.37]]),
  country('澳洲', 'Australia/Sydney', [['雪梨', 151.21], ['墨爾本', 144.96, 'Australia/Melbourne'], ['布里斯本', 153.03, 'Australia/Brisbane'], ['伯斯', 115.86, 'Australia/Perth'], ['阿德雷德', 138.6, 'Australia/Adelaide'], ['坎培拉', 149.13]]),
  country('紐西蘭', 'Pacific/Auckland', [['奧克蘭', 174.76], ['威靈頓', 174.78], ['基督城', 172.64]]),
  country('美國', 'America/New_York', [
    ['紐約', -74.01], ['波士頓', -71.06], ['華盛頓特區', -77.04], ['費城', -75.17], ['亞特蘭大', -84.39], ['邁阿密', -80.19],
    ['芝加哥', -87.63, 'America/Chicago'], ['休士頓', -95.37, 'America/Chicago'], ['達拉斯', -96.8, 'America/Chicago'],
    ['丹佛', -104.99, 'America/Denver'], ['鳳凰城', -112.07, 'America/Phoenix'],
    ['洛杉磯', -118.24, 'America/Los_Angeles'], ['爾灣', -117.79, 'America/Los_Angeles'], ['聖地牙哥', -117.16, 'America/Los_Angeles'],
    ['舊金山', -122.42, 'America/Los_Angeles'], ['聖荷西', -121.89, 'America/Los_Angeles'], ['西雅圖', -122.33, 'America/Los_Angeles'],
    ['拉斯維加斯', -115.14, 'America/Los_Angeles'], ['檀香山', -157.86, 'Pacific/Honolulu'],
  ]),
  country('加拿大', 'America/Toronto', [['多倫多', -79.38], ['渥太華', -75.7], ['蒙特婁', -73.57], ['溫哥華', -123.12, 'America/Vancouver'], ['卡加利', -114.07, 'America/Edmonton'], ['愛德蒙頓', -113.49, 'America/Edmonton']]),
  country('英國', 'Europe/London', [['倫敦', -0.13], ['曼徹斯特', -2.24], ['伯明罕', -1.9], ['愛丁堡', -3.19]]),
  country('法國', 'Europe/Paris', [['巴黎', 2.35], ['里昂', 4.84], ['馬賽', 5.37]]),
  country('德國', 'Europe/Berlin', [['柏林', 13.4], ['法蘭克福', 8.68], ['慕尼黑', 11.58], ['漢堡', 9.99]]),
  country('荷蘭', 'Europe/Amsterdam', [['阿姆斯特丹', 4.9], ['鹿特丹', 4.48]]),
  country('義大利', 'Europe/Rome', [['羅馬', 12.5], ['米蘭', 9.19]]),
  country('西班牙', 'Europe/Madrid', [['馬德里', -3.7], ['巴塞隆納', 2.17]]),
  country('瑞士', 'Europe/Zurich', [['蘇黎世', 8.54], ['日內瓦', 6.14]]),
  country('奧地利', 'Europe/Vienna', [['維也納', 16.37]]),
  country('瑞典', 'Europe/Stockholm', [['斯德哥爾摩', 18.07]]),
  country('巴西', 'America/Sao_Paulo', [['聖保羅', -46.63], ['里約熱內盧', -43.17]]),
  country('阿根廷', 'America/Argentina/Buenos_Aires', [['布宜諾斯艾利斯', -58.38]]),
  country('南非', 'Africa/Johannesburg', [['約翰尼斯堡', 28.05], ['開普敦', 18.42]]),
];

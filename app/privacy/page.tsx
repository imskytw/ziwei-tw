import SimplePage from '@/components/SimplePage';
import { SITE_NAME } from '@/lib/site';

export const metadata = { title: `隱私說明 · ${SITE_NAME}` };

const h2 = { fontSize: 18, marginTop: 32, marginBottom: 10 } as const;

export default function PrivacyPage() {
  return (
    <SimplePage title="隱私說明" updated="2026 年 11 月">
      <h2 style={h2}>1. 排盤在你的瀏覽器裡完成</h2>
      <p>輸入的出生資料用於在瀏覽器中計算命盤，排盤過程不需要連網，也不會上傳到任何資料庫。命盤紀錄只存在你自己瀏覽器的本機儲存空間，清除瀏覽器資料即可刪除。</p>

      <h2 style={h2}>2. 使用 AI 解讀時</h2>
      <p>按下 AI 解讀或提問時，命盤內容與你的問題會經由本站伺服器轉送給架設者設定的 AI 服務（ChatGPT、Claude、Gemini、DeepSeek，或本機的 Ollama）。本站不會保存這些對話；AI 服務如何處理資料，請參考該服務的隱私政策。若選用 Ollama 本機模型，資料不會離開你的電腦。</p>

      <h2 style={h2}>3. 不使用追蹤工具</h2>
      <p>本版已移除原專案的網站流量分析（Vercel Analytics／Speed Insights），不放廣告追蹤程式。</p>

      <h2 style={h2}>4. 自行架設的網站</h2>
      <p>若你把本站公開架設給他人使用，請依實際情況（例如是否另外加裝分析工具、主機服務商紀錄）修改本頁說明。</p>
    </SimplePage>
  );
}

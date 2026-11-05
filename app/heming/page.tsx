'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import { formToBirthInfo } from '@/lib/ziwei/share';
import { generateChart as buildChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';
import { useTheme } from '@/components/ThemeProvider';
import ContentHeader from '@/components/ContentHeader';
import AiContent from '@/components/AiContent';

export default function HemingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // ─── 雙方命盤狀態 ─────────────────────────────────────────
  const [chartA, setChartA] = useState<ZiweiChart | null>(null);
  const [chartB, setChartB] = useState<ZiweiChart | null>(null);
  // 雙方表單狀態由 BirthForm onFormSave 同步到此處，統一按鈕觸發起盤
  const [formA, setFormA] = useState<BirthFormState | null>(null);
  const [formB, setFormB] = useState<BirthFormState | null>(null);

  // ─── AI 合盤分析狀態 ─────────────────────────────────────
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [question, setQuestion] = useState('');
  const [analysisError, setAnalysisError] = useState(false);
  // 開源版不含 /api/heming：介面 404 時單獨說明，而不是讓使用者反覆重試
  const [apiMissing, setApiMissing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  // ─── 起盤（單次呼叫，返回 chart 給統一流程使用）──────────
  // 開源版不含後端 /api/generate：直接用本倉庫的排盤引擎在瀏覽器裡起盤
  const generateChart = useCallback(async (info: BirthInfo): Promise<ZiweiChart | null> => {
    try {
      return buildChart(info);
    } catch {
      return null;
    }
  }, []);

  // 表單是否填齊
  const isFormReady = (f: BirthFormState | null): boolean =>
    !!(f && f.year && f.month && f.day && f.gender && (f.unknownTime || (f.clockHour !== '' && f.clockMinute !== '')));

  // ─── 統一入口：起盤 + 合盤分析 ─────────────────────────────
  const runAnalysis = useCallback(async (q?: string) => {
    setFormError(null);
    if (!isFormReady(formA) || !isFormReady(formB)) {
      setFormError('請先填寫雙方完整出生資訊');
      return;
    }
    setAnalyzing(true);
    setAnalysis('');
    setAnalysisError(false);

    try {
      // 每次按當前表單起盤，避免編輯出生資訊後複用舊盤。
      const [cA, cB] = await Promise.all([
        generateChart(formToBirthInfo(formA!)),
        generateChart(formToBirthInfo(formB!)),
      ]);
      if (!cA || !cB) {
        setAnalysisError(true);
        setAnalyzing(false);
        return;
      }
      setChartA(cA);
      setChartB(cB);

      const res = await fetch('/api/heming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartA: cA, chartB: cB, question: q ?? undefined }),
      });
      if (res.status === 404) { setApiMissing(true); throw new Error('api-missing'); }
      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let pendingLine = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pendingLine += decoder.decode(value, { stream: true });
        const lines = pendingLine.split('\n');
        pendingLine = lines.pop() ?? '';
        for (const rawLine of lines) {
          const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            text += delta;
            setAnalysis(text);
          } catch { /* skip */ }
        }
      }
      // scroll to analysis
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setAnalysisError(true);
    } finally {
      setAnalyzing(false);
    }
  }, [formA, formB, generateChart]);

  const cardStyle = {
    background: 'transparent',
    padding: '0',
  };

  const labelStyle = {
    fontSize: 'var(--step-lead)', fontWeight: 700, color: 'var(--ink)',
    marginBottom: '16px', display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <ContentHeader current="heming" />

      {/* 主體 */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* 標題 */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: 'var(--step-head)', fontWeight: 700, letterSpacing: 0, lineHeight: 1.05, color: 'var(--ink)', marginBottom: '12px' }}>
            紫微合盤
          </h1>
          <p style={{ fontSize: 'var(--step-body)', color: 'var(--ink)', lineHeight: 1.7, maxWidth: '40ch' }}>
            輸入兩個人的出生資訊，AI 基於倪海廈體系分析雙方命盤的緣分匹配度、感情走向與相處建議
          </p>
        </div>

        {/* 雙欄表單 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}
          className="heming-grid">
          {/* 甲方 */}
          <div style={cardStyle}>
            <span style={labelStyle}>第一個人</span>
            <BirthForm
              hideSubmit
              onSubmit={() => {}}
              onFormSave={setFormA}
            />
          </div>

          {/* 乙方 */}
          <div style={cardStyle}>
            <span style={labelStyle}>第二個人</span>
            <BirthForm
              hideSubmit
              onSubmit={() => {}}
              onFormSave={setFormB}
            />
          </div>
        </div>

        {/* ═══ 大合盤分析框（視覺中心，始終顯示）════════════════ */}
        <div ref={analysisRef} style={{
          ...cardStyle,
          minHeight: '320px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: (!analysis && !analyzing) ? 'center' : 'flex-start',
        }}>
          {/* 區塊標題 */}
          <h2 className="heming-title">合盤分析</h2>

          {/* 狀態分支 */}
          {!analysis && !analyzing && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p className="heming-hint">填好兩個人的出生資料，按下按鈕，AI 會依倪海廈的看法分析兩人的契合度與相處方式。</p>
              <button type="button" className="btn" onClick={() => runAnalysis()}>
                開始合盤分析
              </button>
              {formError && (
                <div className="heming-error" role="alert">
                  {formError}
                </div>
              )}
            </div>
          )}

          {analyzing && !analysis && (
            <div className="heming-status" role="status">
              <div style={{
                width: '14px', height: '14px',
                border: '2px solid var(--bdr-med)', borderTopColor: 'var(--ac)',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              正在對比雙方命盤…
            </div>
          )}

          {analysis && <AiContent text={analysis} streaming={analyzing} />}

          {analysisError && (
            <div className="heming-notice" role="alert">
              {apiMissing
                ? 'AI 還沒有設定。請關掉網站視窗，雙擊專案資料夾裡的「設定AI」填入金鑰，再重新啟動。兩人的命盤仍可以分別到「排盤」頁查看。'
                : '這次分析沒有完成，可能是網路或 AI 服務暫時不穩。請再按一次「開始分析」。'}
            </div>
          )}
        </div>

        {/* ═══ 針對合盤的追問聊天框（僅分析完成後顯示）═══════════ */}
        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <h3 className="heming-subtitle">針對這次合盤繼續追問</h3>

            {/* 快捷問題 */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                '感情匹配度如何？',
                '適合合夥創業嗎？',
                '兩人結婚是否合適？',
                '哪方面最容易起衝突？',
                '財運是否互補？',
              ].map(q => (
                <button
                  key={q}
                  type="button"
                  className="heming-chip"
                  onClick={() => { setQuestion(q); runAnalysis(q); }}
                  disabled={analyzing}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* 輸入框 + 追問按鈕 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !analyzing) runAnalysis(question || undefined); }}
                placeholder="繼續追問，如：哪幾年是兩人感情關鍵期？"
                disabled={analyzing}
                className="input-base heming-input"
                aria-label="追問內容"
              />
              <button
                type="button"
                className="btn"
                onClick={() => runAnalysis(question || undefined)}
                disabled={analyzing}
              >
                {analyzing ? '分析中…' : '繼續追問'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 680px) {
          .heming-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

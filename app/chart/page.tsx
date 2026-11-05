'use client';
import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import ReadingPanel from '@/components/ReadingPanel';
import ContentHeader from '@/components/ContentHeader';
import AiStatusBadge from '@/components/AiStatusBadge';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart, Palace } from '@/lib/ziwei/types';

/**
 * 命盤頁 —— 開源版「排盤引擎 Demo」
 *
 * 這是一個最小可執行示例：用本倉庫的排盤引擎 generateChart() 配合基礎 UI
 * 元件，渲染一張完整紫微命盤 + 基礎解讀，並支援本命 / 大限 / 流年切換。
 *
 * 繁體改作版：加上頂欄（回首頁、AI 狀態），並移除與 ChartBoard 內建切換重複的 TimeNav。
 */
function TopBar({ onReset }: { onReset?: () => void }) {
  return (
    <ContentHeader current="chart">
      {onReset && <button type="button" className="btn-ghost" onClick={onReset}>重新排盤</button>}
      <AiStatusBadge />
    </ContentHeader>
  );
}

export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);

  // ── 未起盤：展示出生資訊表單 ──
  if (!chart) {
    return (
      <>
        <TopBar />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 64px' }}>
          <h1 style={{ fontSize: 'var(--step-head)', fontWeight: 900, marginBottom: 12, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>排一張命盤</h1>
          <p style={{ color: 'var(--ink)', marginBottom: 32, fontSize: 'var(--step-body)', lineHeight: 1.7 }}>
            輸入國曆生日、出生地與出生時間，系統會依真太陽時校正時辰；台灣 1945–1979 年間的夏令時間也會提醒你。
          </p>
          <BirthForm onSubmit={(info: BirthInfo) => setChart(generateChart(info))} />
        </main>
      </>
    );
  }

  // ── 已起盤：命盤 + 解讀 ──
  return (
    <>
    <TopBar onReset={() => { setChart(null); setSelectedPalace(null); }} />
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px 48px' }}>
      <div
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]"
        style={{
          gap: 20, marginTop: 16, alignItems: 'start',
        }}
      >
        <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
        <ReadingPanel chart={chart} selectedPalace={selectedPalace} />
      </div>
    </main>
    </>
  );
}

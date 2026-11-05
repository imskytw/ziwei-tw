'use client';
import { useMemo, useState } from 'react';
import { taiwanClockShift } from '@/lib/ziwei/dst-tw';

const days = (y: number, m: number) => new Date(y, m, 0).getDate();

/** 首頁的互動：你出生那天，台灣的鐘錶有沒有比現在快一小時？ */
export default function DstChecker() {
  const [y, setY] = useState(1975);
  const [m, setM] = useState(7);
  const [d, setD] = useState(15);
  const dd = Math.min(d, days(y, m));
  const shift = useMemo(() => taiwanClockShift(y, m, dd), [y, m, dd]);
  return (
    <div className="dst-check">
      <h3>你出生那天，<br />台灣有夏令時間嗎？</h3>
      <div>
        <div className="dst-check__form">
          <select aria-label="出生年" value={y} onChange={e => setY(+e.target.value)}>
            {Array.from({ length: 2026 - 1930 + 1 }, (_, i) => 2026 - i).map(v => <option key={v} value={v}>{v} 年</option>)}
          </select>
          <select aria-label="出生月" value={m} onChange={e => setM(+e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(v => <option key={v} value={v}>{v} 月</option>)}
          </select>
          <select aria-label="出生日" value={dd} onChange={e => setD(+e.target.value)}>
            {Array.from({ length: days(y, m) }, (_, i) => i + 1).map(v => <option key={v} value={v}>{v} 日</option>)}
          </select>
        </div>
        <p className="dst-check__answer" aria-live="polite">
          {shift ? (
            <>
              <b>有。</b>{shift.kind === 'jst' ? '那時台灣使用日本標準時，' : '那天正在實施夏令時間，'}鐘錶比現在快 1 小時。
              出生證明上寫 14:00，換成標準時間是 13:00，時辰從未時變成午時。
              <small>{shift.range}。排盤時，表單會提醒你，並提供「減 1 小時」按鈕。</small>
            </>
          ) : (
            <>
              <b>沒有。</b>那天鐘錶就是標準時間，直接照出生證明上的時間排盤即可。
              <small>台灣實施過夏令時間的年份：1945–1961、1974–1975、1979（依中央氣象署公告）。</small>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

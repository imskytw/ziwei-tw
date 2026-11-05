'use client';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BirthInfo } from '@/lib/ziwei/types';
import { SHICHEN } from '@/lib/ziwei/constants';
import { useTheme } from '@/components/ThemeProvider';
import { PROVINCES, REGION_LABEL, regionOf, type Region } from '@/lib/ziwei/cities';
import { taiwanClockShift } from '@/lib/ziwei/dst-tw';
import { isChinaDST, chinaDSTRange } from '@/lib/ziwei/dst-cn';
import { shiftClock, formatClock, type ClockTime } from '@/lib/ziwei/clock-adjust';
import { formToBirthInfo, calcTrueSolarBranch } from '@/lib/ziwei/share';

export interface BirthFormState {
  name: string;
  year: string;
  month: string;
  day: string;
  clockHour: string;
  clockMinute: string;
  unknownTime: boolean;
  province: string;
  city: string;
  longitude: number;
  gender: 'male' | 'female';
}

interface BirthFormProps {
  onSubmit: (info: BirthInfo) => void;
  loading?: boolean;
  initialData?: Partial<BirthFormState>;
  onFormSave?: (data: BirthFormState) => void;
  /** 隱藏內部「立即起盤」按鈕（合盤等場景由父級統一觸發） */
  hideSubmit?: boolean;
}

const SHICHEN_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 檢查日期是否合法 */
function isValidDate(y: number, m: number, d: number): boolean {
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export default function BirthForm({ onSubmit, loading, initialData, onFormSave, hideSubmit }: BirthFormProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [form, setForm] = useState<BirthFormState>({
    name: initialData?.name ?? '',
    year: initialData?.year ?? '',
    month: initialData?.month ?? '',
    day: initialData?.day ?? '',
    clockHour: initialData?.clockHour ?? '8',
    clockMinute: initialData?.clockMinute ?? '0',
    unknownTime: initialData?.unknownTime ?? false,
    province: initialData?.province ?? '',
    city: initialData?.city ?? '',
    longitude: initialData?.longitude ?? 120,
    gender: initialData?.gender ?? 'male',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  /** 按過「減 1 小時」後保留原始時間，供復原 */
  const [dstUndo, setDstUndo] = useState<ClockTime | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // 表單狀態變化時實時同步給父級（合盤等場景下父級靠這個收集雙方資料）
  useEffect(() => {
    onFormSave?.({ ...form });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const cityList = useMemo(() => {
    const prov = PROVINCES.find(p => p.name === form.province);
    return prov ? prov.cities : [];
  }, [form.province]);

  const branch = useMemo(() => {
    if (form.unknownTime) return 0;
    return calcTrueSolarBranch(
      parseInt(form.clockHour) || 0,
      parseInt(form.clockMinute) || 0,
      form.longitude,
    );
  }, [form.clockHour, form.clockMinute, form.longitude, form.unknownTime]);

  const offsetMin = Math.round((form.longitude - 120) * 4);
  const shichenInfo = SHICHEN[branch];

  // ─── 校驗邏輯 ───────────────────────────────────────────
  const y = parseInt(form.year) || 0;
  const m = parseInt(form.month) || 0;
  const d = parseInt(form.day) || 0;

  const errors = {
    year: !form.year ? '請選擇出生年份'
      : y < 1900 || y > 2026 ? '年份範圍：1900–2026'
      : '',
    month: !form.month ? '請選擇月份' : '',
    day: !form.day ? '請選擇日期'
      : form.year && form.month && !isValidDate(y, m, d) ? `${m}月沒有${d}日`
      : '',
  };
  const hasError = Object.values(errors).some(Boolean);

  // ─── 夏令時／日治時期提示（只提示，由使用者自己決定要不要減 1 小時）──
  const provData = PROVINCES.find(p => p.name === form.province);
  // 還沒選地點時，預設以台灣規則判斷
  const region: Region = form.province ? regionOf(provData) : 'tw';
  const clockShift = useMemo(() => {
    if (!isValidDate(y, m, d)) return null;
    if (region === 'tw') return taiwanClockShift(y, m, d);
    if (region === 'cn' && isChinaDST(y, m, d)) {
      const r = chinaDSTRange(y);
      return { kind: 'dst' as const, aheadMinutes: 60, range: r ? `${y} 年 ${r.start}－${r.end}` : `${y} 年` };
    }
    return null;
  }, [y, m, d, region]);
  const shiftedClock = clockShift ? shiftClock({ clockHour: form.clockHour, clockMinute: form.clockMinute }, -clockShift.aheadMinutes) : null;
  const applyDst = () => {
    if (!shiftedClock) return;
    setDstUndo({ clockHour: form.clockHour, clockMinute: form.clockMinute });
    setForm({ ...form, ...shiftedClock });
  };
  const undoDst = () => {
    if (!dstUndo) return;
    setForm({ ...form, ...dstUndo });
    setDstUndo(null);
  };

  // ─── 完成度（用於進度條） ────────────────────────────────
  const steps = [
    !!form.year && !!form.month && !!form.day && !errors.year && !errors.month && !errors.day,
    !!form.province && !!form.city,
    form.unknownTime || (!!form.clockHour && !!form.clockMinute),
    true, // 性別有預設值
  ];
  const completedSteps = steps.filter(Boolean).length;

  // ─── Summary chip：全部必填完成後顯示 ───────────────────
  const showSummary = steps[0] && steps[2] && !hasError;
  const summaryText = showSummary
    ? [
        `${y}年${m}月${d}日`,
        form.city || (form.province ? form.province : ''),
        form.unknownTime ? '時辰不詳' : `${SHICHEN_NAMES[branch]}時`,
        form.gender === 'male' ? '男' : '女',
      ].filter(Boolean).join(' · ')
    : '';

  const handleProvince = (prov: string) => {
    const provData = PROVINCES.find(p => p.name === prov);
    const firstCity = provData?.cities[0];
    setForm({ ...form, province: prov, city: firstCity?.name || '', longitude: firstCity?.longitude ?? 120 });
  };

  const handleCity = (cityName: string) => {
    const prov = PROVINCES.find(p => p.name === form.province);
    const cityData = prov?.cities.find(c => c.name === cityName);
    setForm({ ...form, city: cityName, longitude: cityData?.longitude ?? 120 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setTouched({ year: true, month: true, day: true });
    if (hasError) return;
    onFormSave?.({ ...form });
    // 統一走 lib/ziwei/share.ts 的轉換：它負責晚子時換日（23:00–23:59 按次日排盤）。
    // 在這裡手拼 BirthInfo 會繞過這條規則，使 /chart 與 /heming 對同一份輸入排出相差一天的盤。
    onSubmit(formToBirthInfo(form));
  };

  // ─── 樣式變數（對應繁體版設計系統）────────────────────
  const bg = 'var(--surface)';
  const border = 'transparent';
  const labelClr = 'var(--muted)';
  const inputBg = 'var(--bg)';
  const inputBorder = 'var(--t-border)';
  const inputClr = 'var(--ink)';
  const focusBorder = 'var(--accent)';
  const errorClr = isDark ? '#f87171' : '#b91c1c';
  const panelBg = 'var(--surface-2)';
  const panelBorder = 'transparent';
  const goldText = 'var(--accent)';
  const summaryBg = 'var(--surface-2)';
  const summaryBorder = 'transparent';
  const summaryClr = 'var(--ink)';

  const inputStyle = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: inputClr,
    borderRadius: '2px',
    padding: '12px 14px',
    fontSize: '16px',
    fontFamily: 'inherit',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  } as React.CSSProperties;

  const errorInputStyle = { ...inputStyle, borderColor: errorClr };

  function FieldError({ msg }: { msg: string }) {
    return (
      <AnimatePresence>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ color: errorClr, fontSize: '14px', marginTop: '4px' }}
          >
            ✕ {msg}
          </motion.p>
        )}
      </AnimatePresence>
    );
  }

  const showErr = (field: string) => touched[field] || submitAttempted;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ background: bg, borderRadius: '4px', padding: 'clamp(20px, 3vw, 32px)' }}
    >
      {/* 標題 */}
      <h2 style={{ color: 'var(--ink)', fontSize: 'var(--step-lead)', marginBottom: '20px', fontWeight: 700 }}>
        出生資料
      </h2>

      {/* ── 進度條 ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {steps.map((done, i) => (
          <motion.div
            key={i}
            animate={{ background: done ? (isDark ? '#d4a843' : '#b07820') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(200,160,60,0.15)') }}
            transition={{ duration: 0.3 }}
            style={{ flex: 1, height: '2px', borderRadius: '2px' }}
          />
        ))}
      </div>

      {/* ── 姓名 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: labelClr, marginBottom: '8px' }}>姓名（可選）</label>
        <input
          type="text"
          placeholder="請輸入姓名"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = focusBorder; }}
          onBlur={e => { e.target.style.borderColor = inputBorder; }}
        />
      </div>

      {/* ── 出生日期 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: labelClr, marginBottom: '8px' }}>出生日期（公曆）</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <select
              value={form.year}
              onChange={e => { setForm({ ...form, year: e.target.value }); setTouched(t => ({ ...t, year: true })); }}
              style={showErr('year') && errors.year ? errorInputStyle : inputStyle}
              required
            >
              <option value="">年份</option>
              {Array.from({ length: 127 }, (_, i) => 2026 - i).map(yr => (
                <option key={yr} value={String(yr)}>{yr}</option>
              ))}
            </select>
            <FieldError msg={showErr('year') ? errors.year : ''} />
          </div>
          <div>
            <select
              value={form.month}
              onChange={e => { setForm({ ...form, month: e.target.value }); setTouched(t => ({ ...t, month: true })); }}
              style={showErr('month') && errors.month ? errorInputStyle : inputStyle}
              required
            >
              <option value="">月份</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
                <option key={mo} value={String(mo)}>{mo} 月</option>
              ))}
            </select>
            <FieldError msg={showErr('month') ? errors.month : ''} />
          </div>
          <div>
            <select
              value={form.day}
              onChange={e => { setForm({ ...form, day: e.target.value }); setTouched(t => ({ ...t, day: true })); }}
              style={showErr('day') && errors.day ? errorInputStyle : inputStyle}
              required
            >
              <option value="">日期</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(dy => (
                <option key={dy} value={String(dy)}>{dy} 日</option>
              ))}
            </select>
            <FieldError msg={showErr('day') ? errors.day : ''} />
          </div>
        </div>
      </div>

      {/* ── 出生地點 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: labelClr, marginBottom: '8px' }}>出生地點（用於真太陽時校正）</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <select
            value={form.province}
            onChange={e => handleProvince(e.target.value)}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = focusBorder; }}
            onBlur={e => { e.target.style.borderColor = inputBorder; }}
          >
            <option value="">縣市 / 省份</option>
            {(['tw', 'hkmo', 'cn'] as Region[]).map(r => (
              <optgroup key={r} label={REGION_LABEL[r]}>
                {PROVINCES.filter(p => regionOf(p) === r).map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            value={form.city}
            onChange={e => handleCity(e.target.value)}
            disabled={!form.province}
            style={{ ...inputStyle, opacity: form.province ? 1 : 0.45 }}
            onFocus={e => { e.target.style.borderColor = focusBorder; }}
            onBlur={e => { e.target.style.borderColor = inputBorder; }}
          >
            <option value="">{form.province ? '鄉鎮市區' : '先選縣市'}</option>
            {cityList.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <AnimatePresence mode="wait">
          {form.province ? (
            <motion.p
              key="location-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: '13px', color: isDark ? 'rgba(180,210,235,0.85)' : 'rgba(100,70,10,0.5)', marginTop: '5px' }}
            >
              {form.city || '（請選擇鄉鎮市區）'} · 經度 {form.longitude.toFixed(1)}°E · 時差 {offsetMin > 0 ? '+' : ''}{offsetMin} 分鐘
            </motion.p>
          ) : (
            <motion.p
              key="location-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: '13px', color: isDark ? 'rgba(165,185,210,0.7)' : 'rgba(140,100,20,0.45)', marginTop: '5px' }}
            >
              * 倪海廈批命用真太陽時，建議選擇出生的鄉鎮市區以自動校正時辰
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── 出生時間 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: labelClr, marginBottom: '8px' }}>出生時間（出生地當時的鐘錶時間）</label>
        <div style={{ borderRadius: '2px', padding: '12px', background: panelBg, border: `1px solid ${panelBorder}`, opacity: form.unknownTime ? 0.45 : 1, pointerEvents: form.unknownTime ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <select
              value={form.clockHour}
              onChange={e => { setForm({ ...form, clockHour: e.target.value }); setDstUndo(null); }}
              style={inputStyle}
            >
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={String(h)}>{h.toString().padStart(2, '0')} 時</option>
              ))}
            </select>
            <select
              value={form.clockMinute}
              onChange={e => { setForm({ ...form, clockMinute: e.target.value }); setDstUndo(null); }}
              style={inputStyle}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(min => (
                <option key={min} value={String(min)}>{min.toString().padStart(2, '0')} 分</option>
              ))}
            </select>
          </div>
          {/* 真太陽時結果 */}
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <span style={{ fontSize: '13px', color: isDark ? 'rgba(170,195,220,0.75)' : 'rgba(140,100,20,0.5)' }}>真太陽時 → </span>
            <span style={{ fontSize: '15px', color: goldText, fontWeight: 600, letterSpacing: '0.08em' }}>
              {SHICHEN_NAMES[branch]}時
            </span>
            {shichenInfo && (
              <span style={{ fontSize: '13px', color: isDark ? 'rgba(170,195,220,0.75)' : 'rgba(140,100,20,0.5)', marginLeft: '4px' }}>
                （{shichenInfo.range}）
              </span>
            )}
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.unknownTime}
            onChange={e => setForm({ ...form, unknownTime: e.target.checked })}
            style={{ width: '14px', height: '14px', borderRadius: '4px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', color: isDark ? 'rgba(165,185,210,0.7)' : 'rgba(140,100,20,0.45)' }}>
            不知道出生時間，以子時（23:00–01:00）起盤
          </span>
        </label>
      </div>

      {/* ── 夏令時提示 ── */}
      <AnimatePresence>
        {clockShift && !form.unknownTime && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginTop: '-6px', marginBottom: '16px' }}
          >
            <div style={{
              borderRadius: '12px', padding: '10px 12px', fontSize: '14px', lineHeight: 1.65,
              background: isDark ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.1)',
              border: `1px solid ${isDark ? 'rgba(234,179,8,0.3)' : 'rgba(202,138,4,0.35)'}`,
              color: isDark ? 'rgba(253,230,138,0.92)' : '#854d0e',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                {clockShift.kind === 'jst' ? '⏰ 日治時期使用日本標準時' : '⏰ 出生當天正在實施夏令時間'}
              </div>
              <div>
                {clockShift.range}，當時鐘錶比現在快 1 小時。
                如果你填的是出生證明或家人記得的「當時鐘錶時間」，通常要減 1 小時才是標準時間；如果已經自己換算過，就不用動。
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {dstUndo ? (
                  <>
                    <span>✓ 已從 {formatClock(dstUndo)} 改為 {formatClock({ clockHour: form.clockHour, clockMinute: form.clockMinute })}</span>
                    <button type="button" onClick={undoDst} style={{ fontSize: '14px', padding: '3px 10px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>復原</button>
                  </>
                ) : shiftedClock ? (
                  <button type="button" onClick={applyDst} style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '8px', border: 'none', background: isDark ? 'rgba(234,179,8,0.25)' : '#ca8a04', color: isDark ? '#fde68a' : '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    減 1 小時，改為 {formatClock(shiftedClock)}
                  </button>
                ) : (
                  <span>減 1 小時會跨到前一天，請手動把日期往前一天、時間改為減 1 小時後的時刻。</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 性別 ── */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: labelClr, marginBottom: '8px' }}>性別</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['male', 'female'] as const).map(g => {
            const active = form.gender === g;
            const isMale = g === 'male';
            const accent = isMale ? '37,99,235' : '225,29,72';
            return (
              <motion.button
                key={g}
                type="button"
                onClick={() => setForm({ ...form, gender: g })}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '2px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: `1px solid ${active ? `rgba(${accent},0.6)` : inputBorder}`,
                  background: active ? `rgba(${accent},0.08)` : inputBg,
                  color: active ? `rgba(${accent},0.9)` : (isDark ? 'rgba(190,205,225,0.7)' : 'rgba(100,80,40,0.4)'),
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              >
                {isMale ? '♂ 男' : '♀ 女'}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── 確認資訊 Summary Chip ── */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 12 }}
            exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div style={{
              background: summaryBg,
              border: `1px solid ${summaryBorder}`,
              borderRadius: '12px',
              padding: '9px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '12px', color: summaryClr }}>✓</span>
              <span style={{ fontSize: '14px', color: summaryClr, letterSpacing: '0.03em', flex: 1 }}>
                {summaryText}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 提交按鈕 ── */}
      {!hideSubmit && <motion.button
        type="submit"
        disabled={loading}
        whileHover={loading ? {} : { scale: 1.01 }}
        whileTap={loading ? {} : { scale: 0.98 }}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '2px',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: loading
            ? (isDark ? 'rgba(212,168,67,0.15)' : 'rgba(180,120,20,0.15)')
            : (isDark
              ? 'var(--accent)'
              : 'var(--accent)'),
          color: loading ? 'var(--muted)' : 'var(--accent-ink)',
          boxShadow: 'none',
          transition: 'all 0.2s',
        }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
            紫微起盤中…
          </span>
        ) : '排盤'}
      </motion.button>}
    </motion.form>
  );
}

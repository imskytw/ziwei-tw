'use client';
import { useEffect } from 'react';

/** 讓 [data-reveal] 區塊進入畫面時依序淡入（沒有 JS 時內容照常顯示） */
export default function Reveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}

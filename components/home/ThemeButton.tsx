'use client';
import { useTheme } from '@/components/ThemeProvider';

export default function ThemeButton() {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" onClick={toggle} aria-label={theme === 'dark' ? '切換成亮色' : '切換成暗色'}>
      {theme === 'dark' ? '亮色' : '暗色'}
    </button>
  );
}

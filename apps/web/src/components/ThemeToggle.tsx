import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: (newTheme: 'light' | 'dark') => void;
  variant?: 'card' | 'navbar' | 'icon-only';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  variant: _variant = 'card',
}) => {
  const isDark = theme === 'dark';
  const handleToggle = () => {
    onToggle(isDark ? 'light' : 'dark');
  };

  const tooltipText = isDark
    ? 'Đang dùng Chế độ Tối (Bấm chuyển sang Chế độ Sáng ☀️)'
    : 'Đang dùng Chế độ Sáng (Bấm chuyển sang Chế độ Tối 🌙)';

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={tooltipText}
      aria-label={tooltipText}
      style={{
        width: '36px',
        height: '34px',
        borderRadius: '8px',
        background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-surface, #FFFFFF)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid var(--border-light, #E2E6D0)',
        color: isDark ? '#F5A642' : 'var(--color-orange-zest)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-orange-zest)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 3px 8px rgba(217, 100, 31, 0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'var(--border-light, #E2E6D0)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
      }}
    >
      {isDark ? <Moon size={16} color="#F5A642" /> : <Sun size={16} color="var(--color-orange-zest)" />}
    </button>
  );
};

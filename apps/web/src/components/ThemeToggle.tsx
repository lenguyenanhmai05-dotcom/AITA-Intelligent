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
  variant = 'card',
}) => {
  const isDark = theme === 'dark';
  const handleToggle = () => {
    onToggle(isDark ? 'light' : 'dark');
  };

  const tooltipText = isDark
    ? 'Đang dùng Chế độ Tối (Bấm để chuyển sang Chế độ Sáng) / Dark Mode (Click for Light)'
    : 'Đang dùng Chế độ Sáng (Bấm để chuyển sang Chế độ Tối) / Light Mode (Click for Dark)';

  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={tooltipText}
        aria-label={tooltipText}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FAF9F1',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #E5E8D6',
          color: isDark ? '#F5A642' : 'var(--color-orange-zest)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {isDark ? <Moon size={16} color="#F5A642" /> : <Sun size={16} color="var(--color-orange-zest)" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={tooltipText}
      aria-label={tooltipText}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: variant === 'navbar' ? '5px 11px' : '6px 12px',
        borderRadius: '9px',
        background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FAF9F1',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #E5E8D6',
        color: isDark ? '#F5A642' : 'var(--color-orange-zest)',
        fontSize: '0.74rem',
        fontWeight: 800,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
        flexShrink: 0,
      }}
    >
      {isDark ? <Moon size={14} color="#F5A642" /> : <Sun size={14} color="var(--color-orange-zest)" />}
      <span>{isDark ? '🌙 Dark' : '☀️ Light'}</span>
    </button>
  );
};

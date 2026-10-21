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
        borderRadius: '10px',
        background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FBEEE6',
        border: isDark ? '1px solid rgba(231, 162, 122, 0.25)' : '1px solid #F7DBCC',
        color: isDark ? '#E7A27A' : '#B5523A',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 3px rgba(122, 62, 46, 0.04)',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#D9794E';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 3px 8px rgba(181, 82, 58, 0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDark ? 'rgba(231, 162, 122, 0.25)' : '#F7DBCC';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(122, 62, 46, 0.04)';
      }}
    >
      {isDark ? <Moon size={16} color="#E7A27A" /> : <Sun size={16} color="#B5523A" />}
    </button>
  );
};

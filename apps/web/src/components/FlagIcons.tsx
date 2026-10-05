import React from 'react';
import { Language } from '../translations';

export const VietnamFlag: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 18, style }) => {
  const width = Math.round(size * 1.5);
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 30 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Red Background */}
      <rect width="30" height="20" fill="#DA251D" />
      {/* Yellow 5-point Star */}
      <polygon
        points="15,3.6 16.545,8.355 21.545,8.355 17.5,11.29 19.045,16.045 15,13.11 10.955,16.045 12.5,11.29 8.455,8.355 13.455,8.355"
        fill="#FFFF00"
      />
    </svg>
  );
};

export const UkFlag: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 18, style }) => {
  const width = Math.round(size * 1.5);
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 60 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    >
      <clipPath id="uk-flag-clip">
        <rect width="60" height="40" rx="3" />
      </clipPath>
      <g clipPath="url(#uk-flag-clip)">
        {/* Navy Blue Field */}
        <rect width="60" height="40" fill="#012169" />
        {/* Diagonal White Cross */}
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
        {/* Diagonal Red Cross */}
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3" />
        {/* Central White Cross */}
        <path d="M30,0 v40 M0,20 h60" stroke="#FFFFFF" strokeWidth="12" />
        {/* Central Red Cross */}
        <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="7" />
      </g>
    </svg>
  );
};

interface LanguageFlagToggleProps {
  lang: Language;
  onToggle: (newLang: Language) => void;
  variant?: 'card' | 'navbar';
}

export const LanguageFlagToggle: React.FC<LanguageFlagToggleProps> = ({
  lang,
  onToggle,
  variant = 'card',
}) => {
  const isVi = lang === 'vi';
  const handleToggle = () => {
    onToggle(isVi ? 'en' : 'vi');
  };

  const tooltipText = isVi
    ? 'Đang dùng Tiếng Việt (Bấm để chuyển sang Tiếng Anh / Click for English)'
    : 'Using English (Click to switch to Vietnamese / Bấm để dùng Tiếng Việt)';

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={tooltipText}
      aria-label={tooltipText}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: variant === 'navbar' ? '6px 12px' : '6px 10px',
        background: variant === 'navbar' ? '#FFFFFF' : '#F6F5ED',
        border: '1.5px solid #E2E6D0',
        borderRadius: '9999px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: variant === 'navbar' ? '0 1px 4px rgba(0, 0, 0, 0.05)' : 'none',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-orange-zest)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 10px rgba(217, 100, 31, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E2E6D0';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = variant === 'navbar' ? '0 1px 4px rgba(0, 0, 0, 0.05)' : 'none';
      }}
    >
      {/* Flag icon */}
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {isVi ? <VietnamFlag size={15} /> : <UkFlag size={15} />}
      </span>

      {/* Language label */}
      <span
        style={{
          fontSize: '0.76rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          color: 'var(--text-main)',
        }}
      >
        {isVi ? 'VI' : 'EN'}
      </span>

      {/* Arrow / indicator */}
      <span
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.8,
        }}
      >
        ⇄ {isVi ? 'EN' : 'VI'}
      </span>
    </button>
  );
};

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

export const UsFlag: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 18, style }) => {
  const width = Math.round(size * 1.5);
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 38 20"
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
      <clipPath id="us-flag-clip">
        <rect width="38" height="20" rx="3" />
      </clipPath>
      <g clipPath="url(#us-flag-clip)">
        {/* White background for the 6 white stripes */}
        <rect width="38" height="20" fill="#FFFFFF" />
        {/* 7 Red stripes */}
        <rect y="0" width="38" height="1.54" fill="#B22234" />
        <rect y="3.08" width="38" height="1.54" fill="#B22234" />
        <rect y="6.15" width="38" height="1.54" fill="#B22234" />
        <rect y="9.23" width="38" height="1.54" fill="#B22234" />
        <rect y="12.31" width="38" height="1.54" fill="#B22234" />
        <rect y="15.38" width="38" height="1.54" fill="#B22234" />
        <rect y="18.46" width="38" height="1.54" fill="#B22234" />
        {/* Navy Blue Canton */}
        <rect width="15.2" height="10.77" fill="#3C3B6E" />
        {/* Star dots pattern in canton */}
        <g fill="#FFFFFF">
          <circle cx="2.5" cy="1.8" r="0.65" />
          <circle cx="5.1" cy="1.8" r="0.65" />
          <circle cx="7.6" cy="1.8" r="0.65" />
          <circle cx="10.1" cy="1.8" r="0.65" />
          <circle cx="12.7" cy="1.8" r="0.65" />
          <circle cx="3.8" cy="3.6" r="0.65" />
          <circle cx="6.4" cy="3.6" r="0.65" />
          <circle cx="8.9" cy="3.6" r="0.65" />
          <circle cx="11.4" cy="3.6" r="0.65" />
          <circle cx="2.5" cy="5.4" r="0.65" />
          <circle cx="5.1" cy="5.4" r="0.65" />
          <circle cx="7.6" cy="5.4" r="0.65" />
          <circle cx="10.1" cy="5.4" r="0.65" />
          <circle cx="12.7" cy="5.4" r="0.65" />
          <circle cx="3.8" cy="7.2" r="0.65" />
          <circle cx="6.4" cy="7.2" r="0.65" />
          <circle cx="8.9" cy="7.2" r="0.65" />
          <circle cx="11.4" cy="7.2" r="0.65" />
          <circle cx="2.5" cy="9.0" r="0.65" />
          <circle cx="5.1" cy="9.0" r="0.65" />
          <circle cx="7.6" cy="9.0" r="0.65" />
          <circle cx="10.1" cy="9.0" r="0.65" />
          <circle cx="12.7" cy="9.0" r="0.65" />
        </g>
      </g>
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
    ? 'Đang dùng Tiếng Việt (Bấm để chuyển sang Tiếng Anh 🇺🇸)'
    : 'Using English (Click to switch to Vietnamese 🇻🇳)';

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={tooltipText}
      aria-label={tooltipText}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px 8px',
        background: variant === 'navbar' ? 'var(--bg-surface, #FFFFFF)' : '#F6F5ED',
        border: '1px solid var(--border-light, #E2E6D0)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: variant === 'navbar' ? '0 1px 4px rgba(0, 0, 0, 0.05)' : 'none',
        userSelect: 'none',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-orange-zest)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 3px 8px rgba(217, 100, 31, 0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-light, #E2E6D0)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = variant === 'navbar' ? '0 1px 4px rgba(0, 0, 0, 0.05)' : 'none';
      }}
    >
      {/* Flag icon only: Vietnam Flag -> click to show US Flag */}
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {isVi ? <VietnamFlag size={16} /> : <UsFlag size={16} />}
      </span>
    </button>
  );
};

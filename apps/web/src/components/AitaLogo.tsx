import React from 'react';

interface AitaLogoProps {
  size?: number;
  className?: string;
  showContainer?: boolean;
}

export const AitaLogo: React.FC<AitaLogoProps> = ({
  size = 48,
  className = '',
  showContainer = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        {/* Gradients for Legs */}
        <linearGradient id="aita-orange-grad" x1="100" y1="40" x2="100" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EEA64B" />
          <stop offset="100%" stopColor="#D9641F" />
        </linearGradient>

        <linearGradient id="aita-leg-left" x1="100" y1="55" x2="60" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EEA64B" />
          <stop offset="100%" stopColor="#D9641F" />
        </linearGradient>

        <linearGradient id="aita-leg-right" x1="100" y1="55" x2="140" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EEA64B" />
          <stop offset="100%" stopColor="#D9641F" />
        </linearGradient>

        {/* Soft shadow for joints */}
        <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" floodColor="#788417" />
        </filter>
      </defs>

      {/* Optional Outer Container (Matches Image 1 squircle) */}
      {showContainer && (
        <rect
          x="4"
          y="4"
          width="192"
          height="192"
          rx="44"
          fill="#F7F9EE"
          stroke="#E6EBCF"
          strokeWidth="3.5"
        />
      )}

      {/* Satellite 1: Left Green Satellite + Dotted line */}
      <line
        x1="54"
        y1="82"
        x2="70"
        y2="96"
        stroke="#AAB026"
        strokeWidth="2.5"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
      <circle cx="54" cy="82" r="7.5" fill="#AAB026" />

      {/* Satellite 2: Right Orange Satellite + Dotted line */}
      <line
        x1="146"
        y1="72"
        x2="134"
        y2="86"
        stroke="#EEA64B"
        strokeWidth="2.5"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
      <circle cx="146" cy="72" r="8" fill="#EEA64B" />

      {/* Middle Faint Horizontal Guide Bar */}
      <line
        x1="76"
        y1="110"
        x2="124"
        y2="110"
        stroke="#E6EACF"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Left Leg */}
      <line
        x1="100"
        y1="55"
        x2="63"
        y2="148"
        stroke="url(#aita-leg-left)"
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* Right Leg */}
      <line
        x1="100"
        y1="55"
        x2="137"
        y2="148"
        stroke="url(#aita-leg-right)"
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* Bottom-Left Joint */}
      <circle cx="63" cy="148" r="15" fill="#D9641F" filter="url(#soft-shadow)" />
      <circle cx="63" cy="148" r="8.5" fill="#FFFFFF" />

      {/* Bottom-Right Joint */}
      <circle cx="137" cy="148" r="15" fill="#D9641F" filter="url(#soft-shadow)" />
      <circle cx="137" cy="148" r="8.5" fill="#FFFFFF" />

      {/* Top Joint */}
      <circle cx="100" cy="52" r="17" fill="#D9641F" filter="url(#soft-shadow)" />
      <circle cx="100" cy="52" r="9" fill="#FFFFFF" />
      <circle cx="100" cy="52" r="4.5" fill="#D9641F" />

      {/* Center Sparkle Joint (AST & AI node) */}
      <circle cx="100" cy="110" r="17" fill="#FFFFFF" filter="url(#soft-shadow)" />
      <circle cx="100" cy="110" r="13" fill="#788417" />
      {/* 4-point star sparkle */}
      <path
        d="M100 102 C100 107 95 110 92 110 C95 110 100 113 100 118 C100 113 105 110 108 110 C105 110 100 107 100 102 Z"
        fill="#F6F1BC"
      />
    </svg>
  );
};

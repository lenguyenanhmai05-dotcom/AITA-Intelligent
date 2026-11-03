import React from 'react';

interface ThemeToggleProps {
  theme?: 'light' | 'dark';
  onToggle?: (newTheme: 'light' | 'dark') => void;
  variant?: 'card' | 'navbar' | 'icon-only';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = () => {
  // Dark mode has been permanently removed across the application
  return null;
};


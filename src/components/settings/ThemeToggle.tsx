import React from 'react'
import type { ColorMode } from '@/hooks/useTheme'

export interface ThemeToggleProps {
  colorMode: ColorMode
  resolvedMode: 'light' | 'dark'
  onToggle: () => void
  onModeChange?: (mode: ColorMode) => void
  size?: 'sm' | 'md' | 'lg'
}

const SunIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const SystemIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  colorMode,
  resolvedMode,
  onToggle,
  size = 'md',
}) => {
  const iconSize = sizeMap[size]

  const getIcon = () => {
    if (colorMode === 'system') {
      return <SystemIcon size={iconSize} />
    }
    return resolvedMode === 'dark' ? <MoonIcon size={iconSize} /> : <SunIcon size={iconSize} />
  }

  const getLabel = () => {
    switch (colorMode) {
      case 'dark':
        return 'Dark mode'
      case 'light':
        return 'Light mode'
      case 'system':
        return `System (${resolvedMode})`
    }
  }

  return (
    <button
      className={`theme-toggle theme-toggle--${size}`}
      onClick={onToggle}
      aria-label={`Current: ${getLabel()}. Click to toggle.`}
      title={getLabel()}
    >
      <span className="theme-toggle__icon">{getIcon()}</span>

      <style>{`
        .theme-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.8);
        }

        .theme-toggle--sm {
          width: 32px;
          height: 32px;
        }

        .theme-toggle--md {
          width: 40px;
          height: 40px;
        }

        .theme-toggle--lg {
          width: 48px;
          height: 48px;
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          transform: scale(1.05);
        }

        .theme-toggle:active {
          transform: scale(0.95);
        }

        .theme-toggle__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .theme-toggle:hover .theme-toggle__icon {
          transform: rotate(15deg);
        }

        /* Light mode styles */
        .light-mode .theme-toggle {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.7);
        }

        .light-mode .theme-toggle:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #000;
        }
      `}</style>
    </button>
  )
}

export default ThemeToggle

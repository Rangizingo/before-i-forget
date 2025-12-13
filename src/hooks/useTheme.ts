import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ThemePreset, ThemeConfig } from '@/types/neural'
import { themePresets } from '@/utils/colorTheory'

export type ColorMode = 'light' | 'dark' | 'system'

export interface UseThemeOptions {
  defaultPreset?: ThemePreset
  defaultMode?: ColorMode
  storageKey?: string
}

export interface UseThemeReturn {
  // Current state
  theme: ThemeConfig
  preset: ThemePreset
  colorMode: ColorMode
  resolvedMode: 'light' | 'dark'

  // Actions
  setPreset: (preset: ThemePreset, customConfig?: ThemeConfig) => void
  setColorMode: (mode: ColorMode) => void
  toggleColorMode: () => void

  // Custom theme
  customTheme: ThemeConfig | null
  setCustomTheme: (theme: ThemeConfig) => void

  // CSS variables
  cssVariables: Record<string, string>
}

const STORAGE_KEY = 'before-i-forget-theme'

/**
 * Hook for managing theme and color mode with system preference support
 */
export function useTheme(options: UseThemeOptions = {}): UseThemeReturn {
  const {
    defaultPreset = 'cosmic-purple',
    defaultMode = 'system',
    storageKey = STORAGE_KEY,
  } = options

  // Load initial state from localStorage
  const [preset, setPresetState] = useState<ThemePreset>(() => {
    if (typeof window === 'undefined') return defaultPreset
    const stored = localStorage.getItem(`${storageKey}-preset`)
    return (stored as ThemePreset) || defaultPreset
  })

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    if (typeof window === 'undefined') return defaultMode
    const stored = localStorage.getItem(`${storageKey}-mode`)
    return (stored as ColorMode) || defaultMode
  })

  const [customTheme, setCustomThemeState] = useState<ThemeConfig | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(`${storageKey}-custom`)
    return stored ? JSON.parse(stored) : null
  })

  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('dark')

  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light')

    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Resolve actual color mode
  const resolvedMode = useMemo(() => {
    if (colorMode === 'system') return systemPreference
    return colorMode
  }, [colorMode, systemPreference])

  // Get current theme config
  const theme = useMemo(() => {
    const baseTheme = preset === 'custom' && customTheme
      ? customTheme
      : themePresets[preset]

    // For light mode, adjust the theme
    if (resolvedMode === 'light') {
      return {
        ...baseTheme,
        name: `${baseTheme.name} (Light)`,
        palette: {
          ...baseTheme.palette,
          // Lighten background for light mode
          background: '#F8F7FF',
          // Adjust other colors for better contrast in light mode
          neuronDormant: '#C4B5FD',
        },
      }
    }

    return baseTheme
  }, [preset, customTheme, resolvedMode])

  // Generate CSS variables
  const cssVariables = useMemo(() => {
    const palette = theme.palette
    return {
      '--color-primary': palette.primary,
      '--color-secondary': palette.secondary,
      '--color-accent': palette.accent,
      '--color-background': palette.background,
      '--color-neuron-active': palette.neuronActive,
      '--color-neuron-completed': palette.neuronCompleted,
      '--color-neuron-dormant': palette.neuronDormant,
      '--color-connection-active': palette.connectionActive,
      '--color-connection-pulsing': palette.connectionPulsing,
      '--color-glow': palette.glowColor,
      '--particle-density': String(theme.particleDensity),
      '--glow-intensity': String(theme.glowIntensity),
      '--ambient-speed': String(theme.ambientSpeed),
      '--color-mode': resolvedMode,
    }
  }, [theme, resolvedMode])

  // Apply CSS variables to document
  useEffect(() => {
    const root = document.documentElement
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Set color-scheme for native elements
    root.style.setProperty('color-scheme', resolvedMode)

    // Add mode class to body
    document.body.classList.remove('light-mode', 'dark-mode')
    document.body.classList.add(`${resolvedMode}-mode`)
  }, [cssVariables, resolvedMode])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`${storageKey}-preset`, preset)
  }, [preset, storageKey])

  useEffect(() => {
    localStorage.setItem(`${storageKey}-mode`, colorMode)
  }, [colorMode, storageKey])

  useEffect(() => {
    if (customTheme) {
      localStorage.setItem(`${storageKey}-custom`, JSON.stringify(customTheme))
    }
  }, [customTheme, storageKey])

  // Actions
  const setPreset = useCallback((newPreset: ThemePreset, customConfig?: ThemeConfig) => {
    setPresetState(newPreset)
    if (newPreset === 'custom' && customConfig) {
      setCustomThemeState(customConfig)
    }
  }, [])

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode)
  }, [])

  const toggleColorMode = useCallback(() => {
    setColorModeState((current) => {
      if (current === 'dark') return 'light'
      if (current === 'light') return 'system'
      return 'dark'
    })
  }, [])

  const setCustomTheme = useCallback((theme: ThemeConfig) => {
    setCustomThemeState(theme)
    setPresetState('custom')
  }, [])

  return {
    theme,
    preset,
    colorMode,
    resolvedMode,
    setPreset,
    setColorMode,
    toggleColorMode,
    customTheme,
    setCustomTheme,
    cssVariables,
  }
}

export default useTheme

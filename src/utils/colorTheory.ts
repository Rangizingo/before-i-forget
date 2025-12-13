import type { ThemeConfig, ThemePreset, ColorPalette } from '@/types/neural'

/**
 * Color Theory Utilities
 * Provides color manipulation and theme management for neural network visualization
 */

// ============================================================================
// Color Conversion Utilities
// ============================================================================

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  const cleaned = hex.replace('#', '')

  // Parse hex values
  const num = parseInt(cleaned, 16)

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Interpolate between two colors
 */
export function interpolateColor(
  color1: string,
  color2: string,
  t: number
): string {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  const r = rgb1.r + (rgb2.r - rgb1.r) * t
  const g = rgb1.g + (rgb2.g - rgb1.g) * t
  const b = rgb1.b + (rgb2.b - rgb1.b) * t

  return rgbToHex(r, g, b)
}

/**
 * Get complementary color (opposite on color wheel)
 */
export function getComplementary(color: string): string {
  const rgb = hexToRgb(color)
  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b)
}

/**
 * Adjust brightness of a color
 * @param factor - Multiplier for brightness (0-2, where 1 is unchanged)
 */
export function adjustBrightness(color: string, factor: number): string {
  const rgb = hexToRgb(color)

  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor)
}

/**
 * Get a lighter glow version of a color
 */
export function getGlowColor(baseColor: string): string {
  const rgb = hexToRgb(baseColor)

  // Increase brightness and saturation
  const factor = 1.5
  const r = Math.min(255, rgb.r * factor + 50)
  const g = Math.min(255, rgb.g * factor + 50)
  const b = Math.min(255, rgb.b * factor + 50)

  return rgbToHex(r, g, b)
}

/**
 * Darken a color
 */
export function darken(color: string, amount: number = 0.2): string {
  return adjustBrightness(color, 1 - amount)
}

/**
 * Lighten a color
 */
export function lighten(color: string, amount: number = 0.2): string {
  return adjustBrightness(color, 1 + amount)
}

/**
 * Convert hex to HSL
 */
export function hexToHsl(
  hex: string
): { h: number; s: number; l: number } {
  const rgb = hexToRgb(hex)
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * Convert HSL to hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}

/**
 * Rotate hue by degrees
 */
export function rotateHue(color: string, degrees: number): string {
  const hsl = hexToHsl(color)
  hsl.h = (hsl.h + degrees) % 360
  if (hsl.h < 0) hsl.h += 360
  return hslToHex(hsl.h, hsl.s, hsl.l)
}

/**
 * Get analogous colors (adjacent on color wheel)
 */
export function getAnalogous(color: string): [string, string] {
  return [rotateHue(color, -30), rotateHue(color, 30)]
}

/**
 * Get triadic colors (120 degrees apart)
 */
export function getTriadic(color: string): [string, string] {
  return [rotateHue(color, 120), rotateHue(color, 240)]
}

/**
 * Adjust saturation
 */
export function adjustSaturation(color: string, factor: number): string {
  const hsl = hexToHsl(color)
  hsl.s = Math.max(0, Math.min(100, hsl.s * factor))
  return hslToHex(hsl.h, hsl.s, hsl.l)
}

// ============================================================================
// Theme Presets
// ============================================================================

export const themePresets: Record<ThemePreset, ThemeConfig> = {
  'cosmic-purple': {
    name: 'Cosmic Purple',
    palette: {
      primary: '#8B5CF6',
      secondary: '#6366F1',
      accent: '#EC4899',
      background: '#0F0A1F',
      neuronActive: '#A78BFA',
      neuronCompleted: '#FBBF24',
      neuronDormant: '#4C4567',
      connectionActive: '#818CF8',
      connectionPulsing: '#C084FC',
      glowColor: '#DDD6FE',
    },
    particleDensity: 1.0,
    glowIntensity: 1.2,
    ambientSpeed: 1.0,
  },

  'bioluminescent': {
    name: 'Bioluminescent',
    palette: {
      primary: '#10B981',
      secondary: '#14B8A6',
      accent: '#06B6D4',
      background: '#0A1F1B',
      neuronActive: '#34D399',
      neuronCompleted: '#FCD34D',
      neuronDormant: '#1F4440',
      connectionActive: '#6EE7B7',
      connectionPulsing: '#5EEAD4',
      glowColor: '#A7F3D0',
    },
    particleDensity: 1.3,
    glowIntensity: 1.5,
    ambientSpeed: 0.8,
  },

  'electric-blue': {
    name: 'Electric Blue',
    palette: {
      primary: '#0EA5E9',
      secondary: '#3B82F6',
      accent: '#8B5CF6',
      background: '#0A1929',
      neuronActive: '#38BDF8',
      neuronCompleted: '#F59E0B',
      neuronDormant: '#1E3A5F',
      connectionActive: '#60A5FA',
      connectionPulsing: '#93C5FD',
      glowColor: '#BFDBFE',
    },
    particleDensity: 0.9,
    glowIntensity: 1.3,
    ambientSpeed: 1.2,
  },

  'sunset-warm': {
    name: 'Sunset Warm',
    palette: {
      primary: '#F97316',
      secondary: '#EF4444',
      accent: '#EC4899',
      background: '#1F0A0A',
      neuronActive: '#FB923C',
      neuronCompleted: '#FBBF24',
      neuronDormant: '#4A2020',
      connectionActive: '#FCA5A5',
      connectionPulsing: '#F472B6',
      glowColor: '#FED7AA',
    },
    particleDensity: 0.8,
    glowIntensity: 1.4,
    ambientSpeed: 0.7,
  },

  'matrix-green': {
    name: 'Matrix Green',
    palette: {
      primary: '#22C55E',
      secondary: '#10B981',
      accent: '#84CC16',
      background: '#0A1F0A',
      neuronActive: '#4ADE80',
      neuronCompleted: '#FDE047',
      neuronDormant: '#1F3F1F',
      connectionActive: '#86EFAC',
      connectionPulsing: '#BBF7D0',
      glowColor: '#DCFCE7',
    },
    particleDensity: 1.1,
    glowIntensity: 1.6,
    ambientSpeed: 1.5,
  },

  custom: {
    name: 'Custom',
    palette: {
      primary: '#8B5CF6',
      secondary: '#6366F1',
      accent: '#EC4899',
      background: '#0F0A1F',
      neuronActive: '#A78BFA',
      neuronCompleted: '#FBBF24',
      neuronDormant: '#4C4567',
      connectionActive: '#818CF8',
      connectionPulsing: '#C084FC',
      glowColor: '#DDD6FE',
    },
    particleDensity: 1.0,
    glowIntensity: 1.0,
    ambientSpeed: 1.0,
  },
}

/**
 * Get a theme by preset name
 */
export function getTheme(preset: ThemePreset): ThemeConfig {
  return themePresets[preset]
}

/**
 * Create a custom theme from a base color
 */
export function createThemeFromColor(baseColor: string): ThemeConfig {
  const [analogous1] = getAnalogous(baseColor)
  const [triadic1] = getTriadic(baseColor)

  return {
    name: 'Custom',
    palette: {
      primary: baseColor,
      secondary: analogous1,
      accent: triadic1,
      background: darken(baseColor, 0.9),
      neuronActive: lighten(baseColor, 0.2),
      neuronCompleted: '#FBBF24', // Golden color for completion
      neuronDormant: darken(baseColor, 0.6),
      connectionActive: lighten(analogous1, 0.3),
      connectionPulsing: lighten(baseColor, 0.4),
      glowColor: lighten(baseColor, 0.5),
    },
    particleDensity: 1.0,
    glowIntensity: 1.0,
    ambientSpeed: 1.0,
  }
}

/**
 * Blend two themes together
 */
export function blendThemes(
  theme1: ThemeConfig,
  theme2: ThemeConfig,
  t: number
): ThemeConfig {
  const blendPalette = (p1: ColorPalette, p2: ColorPalette): ColorPalette => ({
    primary: interpolateColor(p1.primary, p2.primary, t),
    secondary: interpolateColor(p1.secondary, p2.secondary, t),
    accent: interpolateColor(p1.accent, p2.accent, t),
    background: interpolateColor(p1.background, p2.background, t),
    neuronActive: interpolateColor(p1.neuronActive, p2.neuronActive, t),
    neuronCompleted: interpolateColor(p1.neuronCompleted, p2.neuronCompleted, t),
    neuronDormant: interpolateColor(p1.neuronDormant, p2.neuronDormant, t),
    connectionActive: interpolateColor(p1.connectionActive, p2.connectionActive, t),
    connectionPulsing: interpolateColor(p1.connectionPulsing, p2.connectionPulsing, t),
    glowColor: interpolateColor(p1.glowColor, p2.glowColor, t),
  })

  return {
    name: `${theme1.name} → ${theme2.name}`,
    palette: blendPalette(theme1.palette, theme2.palette),
    particleDensity:
      theme1.particleDensity + (theme2.particleDensity - theme1.particleDensity) * t,
    glowIntensity:
      theme1.glowIntensity + (theme2.glowIntensity - theme1.glowIntensity) * t,
    ambientSpeed:
      theme1.ambientSpeed + (theme2.ambientSpeed - theme1.ambientSpeed) * t,
  }
}

/**
 * Get color contrast ratio (WCAG)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color)
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      const v = val / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if text color would be readable on background
 */
export function isReadable(
  textColor: string,
  backgroundColor: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(textColor, backgroundColor)
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7
}

/**
 * Get readable text color for background (black or white)
 */
export function getReadableTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio('#FFFFFF', backgroundColor)
  const blackContrast = getContrastRatio('#000000', backgroundColor)

  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000'
}

export default {
  hexToRgb,
  rgbToHex,
  interpolateColor,
  getComplementary,
  adjustBrightness,
  getGlowColor,
  darken,
  lighten,
  hexToHsl,
  hslToHex,
  rotateHue,
  getAnalogous,
  getTriadic,
  adjustSaturation,
  themePresets,
  getTheme,
  createThemeFromColor,
  blendThemes,
  getContrastRatio,
  isReadable,
  getReadableTextColor,
}

import React, { useState, useCallback } from 'react'
import type { ThemePreset, ThemeConfig } from '@/types/neural'
import { themePresets, createThemeFromColor } from '@/utils/colorTheory'

export interface ColorCustomizerProps {
  currentTheme: ThemePreset
  customTheme?: ThemeConfig
  onThemeChange: (preset: ThemePreset, config?: ThemeConfig) => void
  onClose?: () => void
}

const presetList: { key: ThemePreset; name: string; preview: string }[] = [
  { key: 'cosmic-purple', name: 'Cosmic Purple', preview: '#8B5CF6' },
  { key: 'bioluminescent', name: 'Bioluminescent', preview: '#10B981' },
  { key: 'electric-blue', name: 'Electric Blue', preview: '#0EA5E9' },
  { key: 'sunset-warm', name: 'Sunset Warm', preview: '#F97316' },
  { key: 'matrix-green', name: 'Matrix Green', preview: '#22C55E' },
]

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  currentTheme,
  customTheme,
  onThemeChange,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ThemePreset>(currentTheme)
  const [customColor, setCustomColor] = useState<string>('#8B5CF6')
  const [showCustom, setShowCustom] = useState(currentTheme === 'custom')

  const handlePresetSelect = useCallback(
    (preset: ThemePreset) => {
      setSelectedPreset(preset)
      setShowCustom(false)
      onThemeChange(preset, themePresets[preset])
    },
    [onThemeChange]
  )

  const handleCustomColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const color = e.target.value
      setCustomColor(color)
      const theme = createThemeFromColor(color)
      setSelectedPreset('custom')
      setShowCustom(true)
      onThemeChange('custom', theme)
    },
    [onThemeChange]
  )

  const handleToggleCustom = useCallback(() => {
    if (!showCustom) {
      const theme = createThemeFromColor(customColor)
      setSelectedPreset('custom')
      onThemeChange('custom', theme)
    }
    setShowCustom(!showCustom)
  }, [showCustom, customColor, onThemeChange])

  const activeConfig = selectedPreset === 'custom' && customTheme
    ? customTheme
    : themePresets[selectedPreset]

  return (
    <div className="color-customizer">
      <div className="customizer-header">
        <h3>Color Theme</h3>
        {onClose && (
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="preset-grid">
        {presetList.map(({ key, name, preview }) => (
          <button
            key={key}
            className={`preset-btn ${selectedPreset === key ? 'active' : ''}`}
            onClick={() => handlePresetSelect(key)}
            aria-pressed={selectedPreset === key}
          >
            <div
              className="preset-preview"
              style={{
                background: `linear-gradient(135deg, ${preview} 0%, ${themePresets[key].palette.secondary} 100%)`,
              }}
            />
            <span className="preset-name">{name}</span>
          </button>
        ))}
      </div>

      <div className="custom-section">
        <button
          className={`custom-toggle ${showCustom ? 'active' : ''}`}
          onClick={handleToggleCustom}
        >
          <span>Custom Color</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={showCustom ? 'rotated' : ''}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {showCustom && (
          <div className="custom-picker">
            <label className="picker-label">
              <span>Base Color</span>
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="color-input"
              />
            </label>
            <div className="generated-palette">
              <div
                className="palette-swatch"
                style={{ background: activeConfig.palette.primary }}
                title="Primary"
              />
              <div
                className="palette-swatch"
                style={{ background: activeConfig.palette.secondary }}
                title="Secondary"
              />
              <div
                className="palette-swatch"
                style={{ background: activeConfig.palette.accent }}
                title="Accent"
              />
              <div
                className="palette-swatch"
                style={{ background: activeConfig.palette.neuronActive }}
                title="Active Neuron"
              />
              <div
                className="palette-swatch"
                style={{ background: activeConfig.palette.glowColor }}
                title="Glow"
              />
            </div>
          </div>
        )}
      </div>

      <div className="preview-section">
        <h4>Preview</h4>
        <div
          className="theme-preview"
          style={{ background: activeConfig.palette.background }}
        >
          <div
            className="preview-neuron active"
            style={{
              background: activeConfig.palette.neuronActive,
              boxShadow: `0 0 20px ${activeConfig.palette.glowColor}`,
            }}
          />
          <div
            className="preview-connection"
            style={{ background: activeConfig.palette.connectionActive }}
          />
          <div
            className="preview-neuron completed"
            style={{
              background: activeConfig.palette.neuronCompleted,
              boxShadow: `0 0 10px ${activeConfig.palette.neuronCompleted}40`,
            }}
          />
        </div>
      </div>

      <style>{`
        .color-customizer {
          background: rgba(15, 10, 31, 0.95);
          border-radius: 16px;
          padding: 20px;
          width: 320px;
          border: 1px solid rgba(139, 92, 246, 0.2);
          backdrop-filter: blur(10px);
        }

        .customizer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .customizer-header h3 {
          margin: 0;
          font-size: 18px;
          color: #fff;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #fff;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .preset-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .preset-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .preset-btn.active {
          border-color: rgba(139, 92, 246, 0.6);
          background: rgba(139, 92, 246, 0.1);
        }

        .preset-preview {
          width: 100%;
          height: 40px;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .preset-name {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }

        .custom-section {
          margin-bottom: 16px;
        }

        .custom-toggle {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 16px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }

        .custom-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .custom-toggle.active {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.3);
        }

        .custom-toggle svg {
          transition: transform 0.2s;
        }

        .custom-toggle svg.rotated {
          transform: rotate(180deg);
        }

        .custom-picker {
          margin-top: 12px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .picker-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .picker-label span {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .color-input {
          width: 48px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          background: transparent;
        }

        .color-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        .color-input::-webkit-color-swatch {
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
        }

        .generated-palette {
          display: flex;
          gap: 8px;
        }

        .palette-swatch {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.2s;
        }

        .palette-swatch:hover {
          transform: scale(1.1);
        }

        .preview-section h4 {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 8px;
        }

        .theme-preview {
          height: 80px;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
        }

        .preview-neuron {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .preview-neuron.completed {
          animation: none;
          opacity: 0.7;
        }

        .preview-connection {
          position: absolute;
          width: 60px;
          height: 2px;
          opacity: 0.6;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

export default ColorCustomizer

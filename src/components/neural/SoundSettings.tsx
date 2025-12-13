/**
 * SoundSettings - Audio control component
 *
 * Provides a clean, minimal interface for controlling sound settings.
 * Includes master toggle, volume controls, and individual effect volumes.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSound } from '../../hooks/useSound'
import type { SoundEffect } from '../../types/neural'

// Human-readable labels for sound effects
const EFFECT_LABELS: Record<SoundEffect, string> = {
  'neuron-create': 'Neuron Create',
  'neuron-complete': 'Neuron Complete',
  'connection-form': 'Connection Form',
  'pulse-propagate': 'Pulse Propagate',
  'layer-switch': 'Layer Switch',
  'ambient-loop': 'Ambient Loop',
}

// Icons for sound settings
const SoundOnIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
  </svg>
)

const SoundOffIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

interface SoundSettingsProps {
  className?: string
}

export function SoundSettings({ className = '' }: SoundSettingsProps) {
  const { isEnabled, volume, config, setEnabled, setVolume, setEffectVolume, playEffect } = useSound()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }

  const handleEffectVolumeChange = (effect: SoundEffect, value: number) => {
    setEffectVolume(effect, value)
  }

  const handleTestSound = (effect: SoundEffect) => {
    if (isEnabled) {
      playEffect(effect)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white/80 dark:bg-slate-900/80
        backdrop-blur-sm
        border border-slate-200 dark:border-slate-800
        rounded-lg
        p-4
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          {isEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
          Sound Settings
        </h3>
        <button
          onClick={() => setEnabled(!isEnabled)}
          className={`
            px-3 py-1 rounded-md text-sm font-medium
            transition-colors
            ${isEnabled
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-400 dark:hover:bg-slate-600'
            }
          `}
        >
          {isEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Master Volume */}
      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Master Volume
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="
                w-full h-2 rounded-lg appearance-none cursor-pointer
                bg-slate-200 dark:bg-slate-700
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary-600
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary-600
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-0
              "
            />
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="
              flex items-center justify-between w-full
              px-3 py-2 rounded-md
              text-sm font-medium text-slate-700 dark:text-slate-300
              bg-slate-100 dark:bg-slate-800
              hover:bg-slate-200 dark:hover:bg-slate-700
              transition-colors
            "
          >
            <span>Individual Effect Volumes</span>
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon />
            </motion.div>
          </button>

          {/* Advanced Settings - Individual Effect Volumes */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3"
              >
                {(Object.keys(EFFECT_LABELS) as SoundEffect[]).map((effect) => (
                  <div key={effect} className="pl-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {EFFECT_LABELS[effect]}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          {Math.round(config.effectVolumes[effect] * 100)}%
                        </span>
                        <button
                          onClick={() => handleTestSound(effect)}
                          className="
                            px-2 py-0.5 text-xs rounded
                            bg-slate-200 dark:bg-slate-700
                            text-slate-700 dark:text-slate-300
                            hover:bg-slate-300 dark:hover:bg-slate-600
                            transition-colors
                          "
                        >
                          Test
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={config.effectVolumes[effect]}
                      onChange={(e) => handleEffectVolumeChange(effect, parseFloat(e.target.value))}
                      className="
                        w-full h-1.5 rounded-lg appearance-none cursor-pointer
                        bg-slate-200 dark:bg-slate-700
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-primary-500
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-3
                        [&::-moz-range-thumb]:h-3
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-primary-500
                        [&::-moz-range-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:border-0
                      "
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Disabled State Message */}
      {!isEnabled && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2"
        >
          Sound is currently disabled
        </motion.p>
      )}
    </motion.div>
  )
}

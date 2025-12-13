/**
 * useSound - React hook for sound integration
 *
 * Provides a simple interface for components to play sounds and control audio settings.
 */

import { useState, useEffect, useCallback } from 'react'
import type { SoundEffect, SoundConfig } from '../types/neural'
import { soundManager } from '../systems/audio/SoundManager'

export interface UseSoundReturn {
  playEffect: (effect: SoundEffect) => void
  setEnabled: (enabled: boolean) => void
  setVolume: (volume: number) => void
  setEffectVolume: (effect: SoundEffect, volume: number) => void
  isEnabled: boolean
  volume: number
  config: SoundConfig
  initialized: boolean
}

/**
 * React hook for sound system integration
 */
export function useSound(): UseSoundReturn {
  const [initialized, setInitialized] = useState(false)
  const [isEnabled, setIsEnabled] = useState(soundManager.isEnabled())
  const [volume, setVolumeState] = useState(soundManager.getMasterVolume())
  const [config, setConfig] = useState<SoundConfig>(soundManager.getConfig())

  // Initialize sound system on mount
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        await soundManager.initialize()
        if (mounted) {
          setInitialized(true)
          setConfig(soundManager.getConfig())
        }
      } catch (error) {
        console.error('Failed to initialize sound system:', error)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  // Play a sound effect
  const playEffect = useCallback((effect: SoundEffect) => {
    if (initialized) {
      soundManager.play(effect)
    }
  }, [initialized])

  // Enable or disable sound
  const setEnabled = useCallback((enabled: boolean) => {
    soundManager.setEnabled(enabled)
    setIsEnabled(enabled)
    setConfig(soundManager.getConfig())
  }, [])

  // Set master volume
  const setVolume = useCallback((volume: number) => {
    soundManager.setMasterVolume(volume)
    setVolumeState(volume)
    setConfig(soundManager.getConfig())
  }, [])

  // Set individual effect volume
  const setEffectVolume = useCallback((effect: SoundEffect, volume: number) => {
    soundManager.setEffectVolume(effect, volume)
    setConfig(soundManager.getConfig())
  }, [])

  return {
    playEffect,
    setEnabled,
    setVolume,
    setEffectVolume,
    isEnabled,
    volume,
    config,
    initialized,
  }
}

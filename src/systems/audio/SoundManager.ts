/**
 * SoundManager - Audio management using Howler.js
 *
 * Manages all sound effects and ambient audio for the neural network visualization.
 * Handles loading, playback, volume control, and configuration persistence.
 */

import { Howl, Howler } from 'howler'
import type { SoundEffect, SoundConfig } from '../../types/neural'
import { soundGenerator } from './SoundGenerator'

// LocalStorage key for persisting sound configuration
const SOUND_CONFIG_STORAGE_KEY = 'before-i-forget-sound-config'

// Default sound configuration
const DEFAULT_SOUND_CONFIG: SoundConfig = {
  enabled: true,  // Sound ON by default
  masterVolume: 0.7,
  effectVolumes: {
    'neuron-create': 0.8,
    'neuron-complete': 1.0,
    'connection-form': 0.6,
    'pulse-propagate': 0.5,
    'layer-switch': 0.7,
    'ambient-loop': 0.3,
  },
}

export class SoundManager {
  private sounds: Map<SoundEffect, Howl> = new Map()
  private config: SoundConfig
  private ambientLoop: Howl | null = null
  private initialized: boolean = false
  private audioBuffers: Map<SoundEffect, AudioBuffer> = new Map()

  constructor() {
    // Load configuration from localStorage or use defaults
    this.config = this.loadConfig()

    // Set initial master volume
    Howler.volume(this.config.masterVolume)
  }

  /**
   * Load sound configuration from localStorage
   */
  private loadConfig(): SoundConfig {
    try {
      const stored = localStorage.getItem(SOUND_CONFIG_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SoundConfig>
        return {
          ...DEFAULT_SOUND_CONFIG,
          ...parsed,
          effectVolumes: {
            ...DEFAULT_SOUND_CONFIG.effectVolumes,
            ...(parsed.effectVolumes || {}),
          },
        }
      }
    } catch (error) {
      console.warn('Failed to load sound config from localStorage:', error)
    }
    return { ...DEFAULT_SOUND_CONFIG }
  }

  /**
   * Save sound configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(SOUND_CONFIG_STORAGE_KEY, JSON.stringify(this.config))
    } catch (error) {
      console.warn('Failed to save sound config to localStorage:', error)
    }
  }

  /**
   * Convert AudioBuffer to base64 WAV data URL for Howler.js
   */
  private audioBufferToDataUrl(buffer: AudioBuffer): string {
    const length = buffer.length * buffer.numberOfChannels * 2
    const arrayBuffer = new ArrayBuffer(44 + length)
    const view = new DataView(arrayBuffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    const sampleRate = buffer.sampleRate
    const numChannels = buffer.numberOfChannels

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numChannels * 2, true)
    view.setUint16(32, numChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length, true)

    // Write PCM data
    let offset = 44
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i]
        const int16 = Math.max(-1, Math.min(1, sample)) * 0x7FFF
        view.setInt16(offset, int16, true)
        offset += 2
      }
    }

    // Convert to base64
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    return `data:audio/wav;base64,${base64}`
  }

  /**
   * Initialize the sound system - load all sounds
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Generate all audio buffers
      this.audioBuffers.set('neuron-create', soundGenerator.generateNeuronCreate())
      this.audioBuffers.set('neuron-complete', soundGenerator.generateNeuronComplete())
      this.audioBuffers.set('connection-form', soundGenerator.generateConnectionForm())
      this.audioBuffers.set('pulse-propagate', soundGenerator.generatePulsePropagate())
      this.audioBuffers.set('layer-switch', soundGenerator.generateLayerSwitch())
      this.audioBuffers.set('ambient-loop', soundGenerator.generateAmbientLoop())

      // Create Howl instances for each sound effect
      const soundEffects: SoundEffect[] = [
        'neuron-create',
        'neuron-complete',
        'connection-form',
        'pulse-propagate',
        'layer-switch',
      ]

      for (const effect of soundEffects) {
        const buffer = this.audioBuffers.get(effect)
        if (!buffer) continue

        const dataUrl = this.audioBufferToDataUrl(buffer)
        const howl = new Howl({
          src: [dataUrl],
          volume: this.config.effectVolumes[effect],
          preload: true,
        })

        this.sounds.set(effect, howl)
      }

      // Create ambient loop with special settings
      const ambientBuffer = this.audioBuffers.get('ambient-loop')
      if (ambientBuffer) {
        const dataUrl = this.audioBufferToDataUrl(ambientBuffer)
        this.ambientLoop = new Howl({
          src: [dataUrl],
          volume: this.config.effectVolumes['ambient-loop'],
          loop: true,
          preload: true,
        })
      }

      this.initialized = true
      // SoundManager initialized
    } catch (error) {
      console.error('Failed to initialize SoundManager:', error)
      throw error
    }
  }

  /**
   * Play a sound effect
   */
  play(effect: SoundEffect): void {
    if (!this.initialized || !this.config.enabled) {
      return
    }

    // Ambient loop is handled separately
    if (effect === 'ambient-loop') {
      this.playAmbient()
      return
    }

    const sound = this.sounds.get(effect)
    if (sound) {
      sound.play()
    }
  }

  /**
   * Start playing the ambient loop
   */
  playAmbient(): void {
    if (!this.initialized || !this.config.enabled || !this.ambientLoop) {
      return
    }

    if (!this.ambientLoop.playing()) {
      this.ambientLoop.play()
    }
  }

  /**
   * Stop the ambient loop
   */
  stopAmbient(): void {
    if (this.ambientLoop && this.ambientLoop.playing()) {
      this.ambientLoop.stop()
    }
  }

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    this.config.masterVolume = clampedVolume
    Howler.volume(clampedVolume)
    this.saveConfig()
  }

  /**
   * Set volume for a specific effect (0-1)
   */
  setEffectVolume(effect: SoundEffect, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    this.config.effectVolumes[effect] = clampedVolume

    if (effect === 'ambient-loop' && this.ambientLoop) {
      this.ambientLoop.volume(clampedVolume)
    } else {
      const sound = this.sounds.get(effect)
      if (sound) {
        sound.volume(clampedVolume)
      }
    }

    this.saveConfig()
  }

  /**
   * Enable or disable all sounds
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled

    if (!enabled) {
      // Stop all currently playing sounds
      this.stopAmbient()
      this.sounds.forEach(sound => sound.stop())
    }

    this.saveConfig()
  }

  /**
   * Get current sound configuration
   */
  getConfig(): SoundConfig {
    return { ...this.config }
  }

  /**
   * Get enabled state
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.config.masterVolume
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAmbient()

    this.sounds.forEach(sound => {
      sound.unload()
    })

    if (this.ambientLoop) {
      this.ambientLoop.unload()
    }

    this.sounds.clear()
    this.audioBuffers.clear()
    this.ambientLoop = null
    this.initialized = false

    soundGenerator.dispose()
  }
}

// Export a singleton instance
export const soundManager = new SoundManager()

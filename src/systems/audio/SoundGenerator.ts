/**
 * SoundGenerator - Procedural sound generation using Web Audio API
 *
 * Generates royalty-free sounds programmatically for the neural network visualization.
 * Each sound is carefully crafted to be subtle, pleasing, and non-intrusive.
 */

export class SoundGenerator {
  private audioContext: AudioContext | null = null

  constructor() {
    // Initialize AudioContext lazily to avoid issues with browser autoplay policies
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  /**
   * Get or create the AudioContext
   */
  private getContext(): AudioContext {
    if (!this.audioContext) {
      throw new Error('AudioContext is not supported in this environment')
    }
    return this.audioContext
  }

  /**
   * Generate Neuron Create sound - Light, airy "pop" like a bubble forming
   * Duration: ~0.3 seconds
   */
  generateNeuronCreate(): AudioBuffer {
    const ctx = this.getContext()
    const sampleRate = ctx.sampleRate
    const duration = 0.3
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate

        // Frequency sweep from 800Hz to 400Hz (descending pop)
        const freq = 800 - (400 * (t / duration))

        // Exponential decay envelope
        const envelope = Math.exp(-t * 12)

        // Generate tone with slight harmonics
        const fundamental = Math.sin(2 * Math.PI * freq * t)
        const harmonic = 0.3 * Math.sin(2 * Math.PI * freq * 2 * t)

        // Add subtle noise for texture
        const noise = (Math.random() - 0.5) * 0.05

        data[i] = (fundamental + harmonic + noise) * envelope * 0.15
      }
    }

    return buffer
  }

  /**
   * Generate Neuron Complete sound - Satisfying "ding" with slight reverb
   * Duration: ~1.0 seconds
   */
  generateNeuronComplete(): AudioBuffer {
    const ctx = this.getContext()
    const sampleRate = ctx.sampleRate
    const duration = 1.0
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate

        // Bell-like frequencies (C major chord: C5, E5, G5)
        const freq1 = 523.25  // C5
        const freq2 = 659.25  // E5
        const freq3 = 783.99  // G5

        // Exponential decay with longer tail for satisfying ring
        const envelope = Math.exp(-t * 3.5)

        // Generate bell tones
        const tone1 = Math.sin(2 * Math.PI * freq1 * t)
        const tone2 = 0.6 * Math.sin(2 * Math.PI * freq2 * t)
        const tone3 = 0.4 * Math.sin(2 * Math.PI * freq3 * t)

        // Add metallic shimmer with high frequency modulation
        const shimmer = 0.1 * Math.sin(2 * Math.PI * freq1 * 4 * t) * Math.exp(-t * 8)

        data[i] = (tone1 + tone2 + tone3 + shimmer) * envelope * 0.2
      }
    }

    return buffer
  }

  /**
   * Generate Connection Form sound - Subtle click/snap like synapses connecting
   * Duration: ~0.15 seconds
   */
  generateConnectionForm(): AudioBuffer {
    const ctx = this.getContext()
    const sampleRate = ctx.sampleRate
    const duration = 0.15
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate

        // Sharp attack with quick decay (click sound)
        const envelope = Math.exp(-t * 40)

        // Broadband noise filtered for click characteristic
        const noise = (Math.random() - 0.5) * 2

        // High-frequency transient for snap quality
        const transient = Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 50)

        // Low thump for depth
        const thump = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 25)

        data[i] = (noise * 0.3 + transient * 0.5 + thump * 0.4) * envelope * 0.1
      }
    }

    return buffer
  }

  /**
   * Generate Pulse Propagate sound - Soft "swoosh" as energy flows
   * Duration: ~0.5 seconds
   */
  generatePulsePropagate(): AudioBuffer {
    const ctx = this.getContext()
    const sampleRate = ctx.sampleRate
    const duration = 0.5
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate

        // Frequency sweep from low to high (rising swoosh)
        const freq = 200 + (600 * (t / duration))

        // Bell-shaped envelope for smooth swoosh
        const envelope = Math.sin(Math.PI * (t / duration)) * 0.8

        // Generate filtered noise
        const noise = (Math.random() - 0.5) * 2

        // Tone component
        const tone = Math.sin(2 * Math.PI * freq * t)

        // Mix noise and tone for whoosh quality
        data[i] = (noise * 0.4 + tone * 0.6) * envelope * 0.08
      }
    }

    return buffer
  }

  /**
   * Generate Layer Switch sound - Gentle transition like turning a page
   * Duration: ~0.4 seconds
   */
  generateLayerSwitch(): AudioBuffer {
    const ctx = this.getContext()
    const sampleRate = ctx.sampleRate
    const duration = 0.4
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate

        // Two-stage frequency sweep (down then up)
        const midpoint = duration / 2
        const freq = t < midpoint
          ? 600 - (200 * (t / midpoint))  // Descend to 400Hz
          : 400 + (200 * ((t - midpoint) / midpoint))  // Ascend to 600Hz

        // Smooth envelope
        const envelope = Math.sin(Math.PI * (t / duration))

        // Generate soft tones
        const fundamental = Math.sin(2 * Math.PI * freq * t)
        const harmonic = 0.3 * Math.sin(2 * Math.PI * freq * 1.5 * t)

        // Subtle filtered noise for texture
        const noise = (Math.random() - 0.5) * 0.1

        data[i] = (fundamental + harmonic + noise) * envelope * 0.12
      }
    }

    return buffer
  }

  /**
   * Generate Ambient Loop - Low, atmospheric drone with subtle variations
   * Duration: 30 seconds (seamless loop)
   */
  generateAmbientLoop(): AudioBuffer {
    const ctx = this.getContext()
    const sampleRate = ctx.sampleRate
    const duration = 30.0
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    // Base frequencies for drone (low, meditative)
    const baseFreqs = [55, 82.5, 110, 165]  // A1, E2, A2, E3

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)

      // Slight phase offset between channels for stereo width
      const phaseOffset = channel * 0.1

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate

        let sample = 0

        // Generate multiple drone layers
        baseFreqs.forEach((freq, idx) => {
          // Slow amplitude modulation for organic feel
          const lfoFreq = 0.05 + (idx * 0.02)
          const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * lfoFreq * t + phaseOffset)

          // Generate sine wave with varying amplitude
          const tone = Math.sin(2 * Math.PI * freq * t + phaseOffset)

          // Add subtle harmonics
          const harmonic = 0.2 * Math.sin(2 * Math.PI * freq * 2 * t + phaseOffset)

          sample += (tone + harmonic) * lfo * (0.15 / baseFreqs.length)
        })

        // Add very subtle pink noise for texture
        const noise = (Math.random() - 0.5) * 0.005

        // Ensure seamless loop by fading in/out at edges
        let fadeEnvelope = 1.0
        const fadeTime = 2.0  // 2 second fade
        if (t < fadeTime) {
          fadeEnvelope = t / fadeTime
        } else if (t > duration - fadeTime) {
          fadeEnvelope = (duration - t) / fadeTime
        }

        data[i] = (sample + noise) * fadeEnvelope
      }
    }

    return buffer
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Export a singleton instance
export const soundGenerator = new SoundGenerator()

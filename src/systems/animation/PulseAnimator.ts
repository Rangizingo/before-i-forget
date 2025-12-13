import gsap from 'gsap'
import type { NeuronVisual } from '@/types/neural'

/**
 * PulseAnimator - Handles pulsing animations for active neurons
 * Creates smooth, rhythmic pulsing effects using GSAP
 */

interface PulseConfig {
  intensity: number // 0-1, affects pulse amplitude
  duration: number // seconds for one pulse cycle
  delay: number // seconds before starting
}

interface ActivePulse {
  neuronId: string
  timeline: gsap.core.Timeline
  config: PulseConfig
}

export class PulseAnimator {
  private activePulses: Map<string, ActivePulse> = new Map()
  private neurons: Map<string, NeuronVisual> = new Map()

  constructor() {}

  /**
   * Register a neuron for potential animation
   */
  registerNeuron(neuronId: string, visual: NeuronVisual): void {
    this.neurons.set(neuronId, visual)
  }

  /**
   * Unregister a neuron
   */
  unregisterNeuron(neuronId: string): void {
    this.stopPulse(neuronId)
    this.neurons.delete(neuronId)
  }

  /**
   * Start a pulsing animation on a neuron
   */
  startPulse(
    neuronId: string,
    intensity: number = 0.5,
    duration: number = 1.5,
    delay: number = 0
  ): void {
    const visual = this.neurons.get(neuronId)
    if (!visual) {
      console.warn(`Cannot pulse neuron ${neuronId}: not registered`)
      return
    }

    // Stop existing pulse if any
    this.stopPulse(neuronId)

    const config: PulseConfig = { intensity, duration, delay }

    // Create pulsing timeline
    const timeline = gsap.timeline({
      repeat: -1,
      yoyo: true,
      delay,
    })

    // Base scale
    const baseScale = visual.targetScale || 1.0

    // Pulse scale range
    const minScale = baseScale * (1.0 - intensity * 0.2)
    const maxScale = baseScale * (1.0 + intensity * 0.3)

    // Animate scale
    timeline.to(visual.mesh.scale, {
      x: maxScale,
      y: maxScale,
      z: maxScale,
      duration: duration / 2,
      ease: 'sine.inOut',
    })

    timeline.to(visual.mesh.scale, {
      x: minScale,
      y: minScale,
      z: minScale,
      duration: duration / 2,
      ease: 'sine.inOut',
    })

    // Animate glow if present
    if (visual.glowMesh) {
      const glowTimeline = gsap.timeline({
        repeat: -1,
        yoyo: true,
        delay,
      })

      const minGlow = 1.0
      const maxGlow = 1.0 + intensity * 0.5

      glowTimeline.to(visual.glowMesh.scale, {
        x: maxGlow,
        y: maxGlow,
        z: maxGlow,
        duration: duration / 2,
        ease: 'sine.inOut',
      })

      glowTimeline.to(visual.glowMesh.scale, {
        x: minGlow,
        y: minGlow,
        z: minGlow,
        duration: duration / 2,
        ease: 'sine.inOut',
      })
    }

    // Update pulse phase for shader effects
    timeline.to(visual, {
      pulsePhase: Math.PI * 2,
      duration,
      ease: 'linear',
      repeat: -1,
    })

    this.activePulses.set(neuronId, {
      neuronId,
      timeline,
      config,
    })
  }

  /**
   * Stop pulsing animation on a neuron
   */
  stopPulse(neuronId: string): void {
    const pulse = this.activePulses.get(neuronId)
    if (!pulse) return

    // Kill the timeline
    pulse.timeline.kill()

    // Reset to base scale
    const visual = this.neurons.get(neuronId)
    if (visual) {
      const baseScale = visual.targetScale || 1.0

      gsap.to(visual.mesh.scale, {
        x: baseScale,
        y: baseScale,
        z: baseScale,
        duration: 0.3,
        ease: 'power2.out',
      })

      if (visual.glowMesh) {
        gsap.to(visual.glowMesh.scale, {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 0.3,
          ease: 'power2.out',
        })
      }

      visual.pulsePhase = 0
    }

    this.activePulses.delete(neuronId)
  }

  /**
   * Propagate a pulse from source neuron to connected neurons
   * Creates a ripple effect through the network
   */
  propagatePulse(
    sourceId: string,
    connections: string[],
    maxDepth: number = 2
  ): void {
    this.propagatePulseRecursive(sourceId, connections, 0, maxDepth, new Set())
  }

  private propagatePulseRecursive(
    sourceId: string,
    connections: string[],
    currentDepth: number,
    maxDepth: number,
    visited: Set<string>
  ): void {
    if (currentDepth >= maxDepth) return
    if (visited.has(sourceId)) return

    visited.add(sourceId)

    // Pulse the source with decreasing intensity
    const intensity = 0.8 * Math.pow(0.7, currentDepth)
    const duration = 1.0 + currentDepth * 0.2
    const delay = currentDepth * 0.1

    this.startPulse(sourceId, intensity, duration, delay)

    // Auto-stop after a few cycles
    const stopDelay = delay + duration * 3
    setTimeout(() => {
      this.stopPulse(sourceId)
    }, stopDelay * 1000)

    // Recursively propagate to connected neurons
    if (currentDepth < maxDepth - 1) {
      connections.forEach((connectedId) => {
        if (!visited.has(connectedId)) {
          // Get connections for the next level (in a real system, this would come from network state)
          this.propagatePulseRecursive(
            connectedId,
            [], // Would need to fetch connections for this neuron
            currentDepth + 1,
            maxDepth,
            visited
          )
        }
      })
    }
  }

  /**
   * Create a single pulse (non-repeating)
   */
  singlePulse(
    neuronId: string,
    intensity: number = 0.7,
    duration: number = 0.8
  ): Promise<void> {
    return new Promise((resolve) => {
      const visual = this.neurons.get(neuronId)
      if (!visual) {
        resolve()
        return
      }

      const baseScale = visual.targetScale || 1.0
      const maxScale = baseScale * (1.0 + intensity * 0.5)

      const timeline = gsap.timeline({
        onComplete: () => resolve(),
      })

      // Pulse up
      timeline.to(visual.mesh.scale, {
        x: maxScale,
        y: maxScale,
        z: maxScale,
        duration: duration / 2,
        ease: 'power2.out',
      })

      // Pulse down
      timeline.to(visual.mesh.scale, {
        x: baseScale,
        y: baseScale,
        z: baseScale,
        duration: duration / 2,
        ease: 'power2.in',
      })

      // Glow pulse
      if (visual.glowMesh) {
        const glowMax = 1.0 + intensity * 0.7

        timeline.to(
          visual.glowMesh.scale,
          {
            x: glowMax,
            y: glowMax,
            z: glowMax,
            duration: duration / 2,
            ease: 'power2.out',
          },
          0
        )

        timeline.to(
          visual.glowMesh.scale,
          {
            x: 1.0,
            y: 1.0,
            z: 1.0,
            duration: duration / 2,
            ease: 'power2.in',
          },
          duration / 2
        )
      }
    })
  }

  /**
   * Update intensity of an active pulse
   */
  updateIntensity(neuronId: string, newIntensity: number): void {
    const pulse = this.activePulses.get(neuronId)
    if (!pulse) return

    // Restart pulse with new intensity
    this.startPulse(
      neuronId,
      newIntensity,
      pulse.config.duration,
      0 // No delay for update
    )
  }

  /**
   * Check if a neuron is currently pulsing
   */
  isPulsing(neuronId: string): boolean {
    return this.activePulses.has(neuronId)
  }

  /**
   * Stop all active pulses
   */
  stopAll(): void {
    this.activePulses.forEach((pulse) => {
      this.stopPulse(pulse.neuronId)
    })
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.stopAll()
    this.neurons.clear()
    this.activePulses.clear()
  }
}

export default PulseAnimator

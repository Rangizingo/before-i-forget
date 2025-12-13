import gsap from 'gsap'
import * as THREE from 'three'
import type { NeuronVisual, ConnectionVisual } from '@/types/neural'
import type { SceneManager } from '@/systems/rendering'

/**
 * FireAnimator - Spectacular animations when tasks are completed
 * Multi-stage animation sequence:
 * 1. Bright flash at completed neuron
 * 2. Energy wave ripples outward through connections
 * 3. New growth sparks appear
 * 4. Network gently expands
 */

interface FireParticle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  lifetime: number
  age: number
}

export class FireAnimator {
  private sceneManager: SceneManager | null = null
  private neurons: Map<string, NeuronVisual> = new Map()
  private connections: Map<string, ConnectionVisual> = new Map()
  private particles: FireParticle[] = []
  private isAnimating = false

  constructor() {}

  /**
   * Set the scene manager for adding particles
   */
  setSceneManager(sceneManager: SceneManager): void {
    this.sceneManager = sceneManager
  }

  /**
   * Register a neuron for animation
   */
  registerNeuron(neuronId: string, visual: NeuronVisual): void {
    this.neurons.set(neuronId, visual)
  }

  /**
   * Register a connection for animation
   */
  registerConnection(connectionId: string, visual: ConnectionVisual): void {
    this.connections.set(connectionId, visual)
  }

  /**
   * Unregister a neuron
   */
  unregisterNeuron(neuronId: string): void {
    this.neurons.delete(neuronId)
  }

  /**
   * Unregister a connection
   */
  unregisterConnection(connectionId: string): void {
    this.connections.delete(connectionId)
  }

  /**
   * Fire the completion animation
   */
  async fireCompletion(
    neuronId: string,
    connectedNeurons: string[]
  ): Promise<void> {
    const visual = this.neurons.get(neuronId)
    if (!visual || !this.sceneManager) {
      console.warn(`Cannot fire completion for ${neuronId}`)
      return
    }

    this.isAnimating = true

    // Create master timeline
    const masterTimeline = gsap.timeline()

    // STAGE 1: Bright flash at neuron (0-0.3s)
    await this.createFlash(visual, masterTimeline)

    // STAGE 2: Energy wave through connections (0.2-1.0s)
    this.createEnergyWave(connectedNeurons, masterTimeline)

    // STAGE 3: Growth sparks (0.5-1.5s)
    this.createGrowthSparks(visual, masterTimeline)

    // STAGE 4: Network expansion (0.8-2.0s)
    this.createNetworkExpansion(connectedNeurons, masterTimeline)

    // Wait for timeline to complete
    return new Promise((resolve) => {
      masterTimeline.eventCallback('onComplete', () => {
        this.isAnimating = false
        resolve()
      })
    })
  }

  /**
   * STAGE 1: Create bright flash effect
   */
  private async createFlash(
    visual: NeuronVisual,
    timeline: gsap.core.Timeline
  ): Promise<void> {
    // Scale pulse
    timeline.to(
      visual.mesh.scale,
      {
        x: 2.5,
        y: 2.5,
        z: 2.5,
        duration: 0.15,
        ease: 'power4.out',
      },
      0
    )

    timeline.to(
      visual.mesh.scale,
      {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.15,
        ease: 'power2.in',
      },
      0.15
    )

    // Glow intensity
    if (visual.glowMesh) {
      timeline.to(
        visual.glowMesh.scale,
        {
          x: 3.0,
          y: 3.0,
          z: 3.0,
          duration: 0.2,
          ease: 'power4.out',
        },
        0
      )

      timeline.to(
        visual.glowMesh.scale,
        {
          x: 1.5,
          y: 1.5,
          z: 1.5,
          duration: 0.2,
          ease: 'power2.in',
        },
        0.2
      )

      // Flash brightness through material
      const glowMaterial = visual.glowMesh.material as THREE.ShaderMaterial
      if (glowMaterial.uniforms?.glowIntensity) {
        timeline.to(
          glowMaterial.uniforms.glowIntensity,
          {
            value: 3.0,
            duration: 0.1,
            ease: 'power4.out',
          },
          0
        )

        timeline.to(
          glowMaterial.uniforms.glowIntensity,
          {
            value: 1.2,
            duration: 0.3,
            ease: 'power2.in',
          },
          0.1
        )
      }
    }
  }

  /**
   * STAGE 2: Create energy wave through connections
   */
  private createEnergyWave(
    connectedNeurons: string[],
    timeline: gsap.core.Timeline
  ): void {
    connectedNeurons.forEach((targetId, index) => {
      const targetVisual = this.neurons.get(targetId)
      if (!targetVisual) return

      const delay = 0.2 + index * 0.05

      // Pulse the connected neuron
      timeline.to(
        targetVisual.mesh.scale,
        {
          x: 1.5,
          y: 1.5,
          z: 1.5,
          duration: 0.3,
          ease: 'power2.out',
        },
        delay
      )

      timeline.to(
        targetVisual.mesh.scale,
        {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 0.3,
          ease: 'power2.in',
        },
        delay + 0.3
      )

      // Glow pulse
      if (targetVisual.glowMesh) {
        timeline.to(
          targetVisual.glowMesh.scale,
          {
            x: 2.0,
            y: 2.0,
            z: 2.0,
            duration: 0.3,
            ease: 'power2.out',
          },
          delay
        )

        timeline.to(
          targetVisual.glowMesh.scale,
          {
            x: 1.0,
            y: 1.0,
            z: 1.0,
            duration: 0.3,
            ease: 'power2.in',
          },
          delay + 0.3
        )
      }
    })
  }

  /**
   * STAGE 3: Create growth sparks
   */
  private createGrowthSparks(
    visual: NeuronVisual,
    timeline: gsap.core.Timeline
  ): void {
    if (!this.sceneManager) return

    const sparkCount = 8
    const position = visual.mesh.position

    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2
      const distance = 2.0 + Math.random() * 2.0

      // Create spark geometry
      const geometry = new THREE.SphereGeometry(0.1, 8, 8)
      const material = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 1.0,
      })
      const spark = new THREE.Mesh(geometry, material)

      spark.position.copy(position)
      this.sceneManager.add(spark)

      // Animate spark
      const targetX = position.x + Math.cos(angle) * distance
      const targetY = position.y + Math.sin(angle) * distance
      const targetZ = position.z + (Math.random() - 0.5) * distance

      timeline.to(
        spark.position,
        {
          x: targetX,
          y: targetY,
          z: targetZ,
          duration: 1.0,
          ease: 'power2.out',
        },
        0.5
      )

      // Fade out
      timeline.to(
        material,
        {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            this.sceneManager?.remove(spark)
            geometry.dispose()
            material.dispose()
          },
        },
        1.0
      )

      // Scale down
      timeline.to(
        spark.scale,
        {
          x: 0.1,
          y: 0.1,
          z: 0.1,
          duration: 1.0,
          ease: 'power2.in',
        },
        0.5
      )
    }
  }

  /**
   * STAGE 4: Create gentle network expansion
   */
  private createNetworkExpansion(
    connectedNeurons: string[],
    timeline: gsap.core.Timeline
  ): void {
    connectedNeurons.forEach((neuronId) => {
      const visual = this.neurons.get(neuronId)
      if (!visual) return

      const originalPos = visual.mesh.position.clone()

      // Calculate slight outward movement
      const direction = new THREE.Vector3(
        originalPos.x,
        originalPos.y,
        originalPos.z
      ).normalize()

      const pushDistance = 0.3

      timeline.to(
        visual.mesh.position,
        {
          x: originalPos.x + direction.x * pushDistance,
          y: originalPos.y + direction.y * pushDistance,
          z: originalPos.z + direction.z * pushDistance,
          duration: 0.6,
          ease: 'power2.out',
        },
        0.8
      )

      // Settle back
      timeline.to(
        visual.mesh.position,
        {
          x: originalPos.x + direction.x * pushDistance * 0.3,
          y: originalPos.y + direction.y * pushDistance * 0.3,
          z: originalPos.z + direction.z * pushDistance * 0.3,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
        },
        1.4
      )
    })
  }

  /**
   * Create a quick celebration burst (lighter version)
   */
  async quickBurst(neuronId: string): Promise<void> {
    const visual = this.neurons.get(neuronId)
    if (!visual) return

    const timeline = gsap.timeline()

    // Quick scale pulse
    timeline.to(visual.mesh.scale, {
      x: 1.8,
      y: 1.8,
      z: 1.8,
      duration: 0.2,
      ease: 'power3.out',
    })

    timeline.to(visual.mesh.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 0.3,
      ease: 'elastic.out(1, 0.3)',
    })

    return new Promise((resolve) => {
      timeline.eventCallback('onComplete', () => resolve())
    })
  }

  /**
   * Update particles (call this each frame)
   */
  update(delta: number): void {
    // Update any active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.age += delta

      // Update position
      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(delta)
      )

      // Fade out
      const lifeRatio = particle.age / particle.lifetime
      const material = particle.mesh.material as THREE.MeshBasicMaterial
      material.opacity = 1.0 - lifeRatio

      // Remove dead particles
      if (particle.age >= particle.lifetime) {
        this.sceneManager?.remove(particle.mesh)
        particle.mesh.geometry.dispose()
        material.dispose()
        this.particles.splice(i, 1)
      }
    }
  }

  /**
   * Check if currently animating
   */
  isActive(): boolean {
    return this.isAnimating
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.neurons.clear()
    this.connections.clear()

    // Clean up particles
    this.particles.forEach((particle) => {
      this.sceneManager?.remove(particle.mesh)
      particle.mesh.geometry.dispose()
      ;(particle.mesh.material as THREE.Material).dispose()
    })
    this.particles = []
  }
}

export default FireAnimator

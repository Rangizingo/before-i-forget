import gsap from 'gsap'
import * as THREE from 'three'
import type { NeuronVisual, ConnectionVisual } from '@/types/neural'
import type { SceneManager } from '@/systems/rendering'

/**
 * DecayAnimator - Graceful dissolution of neurons and connections
 * Handles deletion animations with elegant fading and retraction
 */

export class DecayAnimator {
  private sceneManager: SceneManager | null = null
  private neurons: Map<string, NeuronVisual> = new Map()
  private connections: Map<string, ConnectionVisual> = new Map()

  constructor() {}

  /**
   * Set the scene manager
   */
  setSceneManager(sceneManager: SceneManager): void {
    this.sceneManager = sceneManager
  }

  /**
   * Register a neuron
   */
  registerNeuron(neuronId: string, visual: NeuronVisual): void {
    this.neurons.set(neuronId, visual)
  }

  /**
   * Register a connection
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
   * Animate neuron death with graceful dissolution
   */
  async animateNeuronDeath(neuronId: string): Promise<void> {
    const visual = this.neurons.get(neuronId)
    if (!visual) {
      console.warn(`Cannot animate death for ${neuronId}: not found`)
      return
    }

    const timeline = gsap.timeline()

    // STAGE 1: Dim and shrink (0-0.5s)
    timeline.to(
      visual.mesh.scale,
      {
        x: 0.3,
        y: 0.3,
        z: 0.3,
        duration: 0.5,
        ease: 'power2.in',
      },
      0
    )

    // Fade material
    const material = visual.mesh.material as THREE.ShaderMaterial
    if (material.uniforms?.glowIntensity) {
      timeline.to(
        material.uniforms.glowIntensity,
        {
          value: 0,
          duration: 0.5,
          ease: 'power2.in',
        },
        0
      )
    }

    if (material.uniforms?.energy) {
      timeline.to(
        material.uniforms.energy,
        {
          value: 0,
          duration: 0.5,
          ease: 'power2.in',
        },
        0
      )
    }

    // STAGE 2: Glow fade (0-0.6s)
    if (visual.glowMesh) {
      timeline.to(
        visual.glowMesh.scale,
        {
          x: 2.0,
          y: 2.0,
          z: 2.0,
          duration: 0.3,
          ease: 'power1.out',
        },
        0
      )

      timeline.to(
        visual.glowMesh.scale,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.3,
          ease: 'power2.in',
        },
        0.3
      )

      const glowMaterial = visual.glowMesh.material as THREE.ShaderMaterial
      if (glowMaterial.uniforms?.glowIntensity) {
        timeline.to(
          glowMaterial.uniforms.glowIntensity,
          {
            value: 0,
            duration: 0.6,
            ease: 'power2.in',
          },
          0
        )
      }
    }

    // STAGE 3: Final collapse (0.5-0.8s)
    timeline.to(
      visual.mesh.scale,
      {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.3,
        ease: 'power4.in',
      },
      0.5
    )

    // Final cleanup
    return new Promise((resolve) => {
      timeline.eventCallback('onComplete', () => {
        this.neurons.delete(neuronId)
        resolve()
      })
    })
  }

  /**
   * Animate connection dissolving
   */
  async animateConnectionDissolve(connectionId: string): Promise<void> {
    const visual = this.connections.get(connectionId)
    if (!visual) {
      console.warn(`Cannot dissolve connection ${connectionId}: not found`)
      return
    }

    const timeline = gsap.timeline()

    const lineMaterial = visual.line.material as THREE.LineBasicMaterial

    // STAGE 1: Pulse fade (0-0.4s)
    timeline.to(
      lineMaterial,
      {
        opacity: 0.8,
        duration: 0.15,
        ease: 'power2.out',
      },
      0
    )

    timeline.to(
      lineMaterial,
      {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.in',
      },
      0.15
    )

    // Fade particles if present
    if (visual.particles) {
      const particleMaterial = visual.particles.material as THREE.PointsMaterial

      timeline.to(
        particleMaterial,
        {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
        },
        0.1
      )
    }

    return new Promise((resolve) => {
      timeline.eventCallback('onComplete', () => {
        this.connections.delete(connectionId)
        resolve()
      })
    })
  }

  /**
   * Animate neuron fading to dormant state (not full deletion)
   */
  async fadeToRest(neuronId: string): Promise<void> {
    const visual = this.neurons.get(neuronId)
    if (!visual) return

    const timeline = gsap.timeline()

    // Reduce to small dormant scale
    const dormantScale = (visual.targetScale || 1.0) * 0.6

    timeline.to(visual.mesh.scale, {
      x: dormantScale,
      y: dormantScale,
      z: dormantScale,
      duration: 0.8,
      ease: 'power2.inOut',
    })

    // Dim energy
    const material = visual.mesh.material as THREE.ShaderMaterial
    if (material.uniforms?.energy) {
      timeline.to(
        material.uniforms.energy,
        {
          value: 0.2,
          duration: 0.8,
          ease: 'power2.inOut',
        },
        0
      )
    }

    if (material.uniforms?.glowIntensity) {
      timeline.to(
        material.uniforms.glowIntensity,
        {
          value: 0.3,
          duration: 0.8,
          ease: 'power2.inOut',
        },
        0
      )
    }

    // Reduce glow
    if (visual.glowMesh) {
      timeline.to(
        visual.glowMesh.scale,
        {
          x: 0.5,
          y: 0.5,
          z: 0.5,
          duration: 0.8,
          ease: 'power2.inOut',
        },
        0
      )
    }

    return new Promise((resolve) => {
      timeline.eventCallback('onComplete', () => resolve())
    })
  }

  /**
   * Animate neuron awakening from dormant state
   */
  async awaken(neuronId: string): Promise<void> {
    const visual = this.neurons.get(neuronId)
    if (!visual) return

    const timeline = gsap.timeline()

    const activeScale = visual.targetScale || 1.0

    // Quick flash
    timeline.to(visual.mesh.scale, {
      x: activeScale * 1.2,
      y: activeScale * 1.2,
      z: activeScale * 1.2,
      duration: 0.3,
      ease: 'back.out(2)',
    })

    timeline.to(visual.mesh.scale, {
      x: activeScale,
      y: activeScale,
      z: activeScale,
      duration: 0.3,
      ease: 'elastic.out(1, 0.5)',
    })

    // Restore energy
    const material = visual.mesh.material as THREE.ShaderMaterial
    if (material.uniforms?.energy) {
      timeline.to(
        material.uniforms.energy,
        {
          value: 1.0,
          duration: 0.5,
          ease: 'power2.out',
        },
        0
      )
    }

    if (material.uniforms?.glowIntensity) {
      timeline.to(
        material.uniforms.glowIntensity,
        {
          value: 1.0,
          duration: 0.5,
          ease: 'power2.out',
        },
        0
      )
    }

    // Restore glow
    if (visual.glowMesh) {
      timeline.to(
        visual.glowMesh.scale,
        {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 0.5,
          ease: 'back.out(1.5)',
        },
        0
      )
    }

    return new Promise((resolve) => {
      timeline.eventCallback('onComplete', () => resolve())
    })
  }

  /**
   * Fragmentation effect - neuron breaks into pieces before fading
   */
  async fragmentAndFade(neuronId: string): Promise<void> {
    const visual = this.neurons.get(neuronId)
    if (!visual || !this.sceneManager) return

    const timeline = gsap.timeline()

    // Create fragment particles
    const fragmentCount = 8
    const position = visual.mesh.position.clone()
    const fragments: THREE.Mesh[] = []

    for (let i = 0; i < fragmentCount; i++) {
      const geometry = new THREE.SphereGeometry(0.15, 8, 8)
      const material = new THREE.MeshBasicMaterial({
        color: 0x8866ff,
        transparent: true,
        opacity: 0.8,
      })
      const fragment = new THREE.Mesh(geometry, material)

      fragment.position.copy(position)
      this.sceneManager.add(fragment)
      fragments.push(fragment)

      // Random direction
      const angle = (i / fragmentCount) * Math.PI * 2
      const distance = 1.5 + Math.random() * 1.5
      const targetX = position.x + Math.cos(angle) * distance
      const targetY = position.y + Math.sin(angle) * distance
      const targetZ = position.z + (Math.random() - 0.5) * distance

      // Fly out
      timeline.to(
        fragment.position,
        {
          x: targetX,
          y: targetY,
          z: targetZ,
          duration: 0.8,
          ease: 'power2.out',
        },
        0
      )

      // Fade and shrink
      timeline.to(
        material,
        {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.in',
        },
        0.2
      )

      timeline.to(
        fragment.scale,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.6,
          ease: 'power2.in',
        },
        0.2
      )
    }

    // Original neuron fades quickly
    timeline.to(
      visual.mesh.scale,
      {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.3,
        ease: 'power2.in',
      },
      0
    )

    if (visual.glowMesh) {
      timeline.to(
        visual.glowMesh.scale,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.3,
          ease: 'power2.in',
        },
        0
      )
    }

    return new Promise((resolve) => {
      timeline.eventCallback('onComplete', () => {
        // Clean up fragments
        fragments.forEach((fragment) => {
          this.sceneManager?.remove(fragment)
          fragment.geometry.dispose()
          ;(fragment.material as THREE.Material).dispose()
        })
        this.neurons.delete(neuronId)
        resolve()
      })
    })
  }

  /**
   * Quick fade (no elaborate animation)
   */
  async quickFade(neuronId: string): Promise<void> {
    const visual = this.neurons.get(neuronId)
    if (!visual) return

    const timeline = gsap.timeline()

    timeline.to(visual.mesh.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.3,
      ease: 'power2.in',
    })

    if (visual.glowMesh) {
      timeline.to(
        visual.glowMesh.scale,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.3,
          ease: 'power2.in',
        },
        0
      )
    }

    return new Promise((resolve) => {
      timeline.eventCallback('onComplete', () => {
        this.neurons.delete(neuronId)
        resolve()
      })
    })
  }

  /**
   * Retract all connections from a neuron before deletion
   */
  async retractConnections(connectionIds: string[]): Promise<void> {
    const promises = connectionIds.map((id) =>
      this.animateConnectionDissolve(id)
    )
    await Promise.all(promises)
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.neurons.clear()
    this.connections.clear()
  }
}

export default DecayAnimator

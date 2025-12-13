import gsap from 'gsap'
import * as THREE from 'three'
import type { NeuronData, NeuronVisual, ConnectionData, ConnectionVisual } from '@/types/neural'
import type { SceneManager } from '@/systems/rendering'

/**
 * GrowthAnimator - Animates new neurons appearing in the network
 * Stages:
 * 1. Small spark appears at spawn point
 * 2. Spark grows into full neuron
 * 3. Connections snake out to nearby neurons
 * 4. Gentle settling into final position
 */

export class GrowthAnimator {
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
   * Animate a neuron being born
   */
  async animateNeuronBirth(
    neuron: NeuronData,
    connections: ConnectionData[]
  ): Promise<void> {
    const visual = this.neurons.get(neuron.id)
    if (!visual || !this.sceneManager) {
      console.warn(`Cannot animate birth for ${neuron.id}`)
      return
    }

    // Store final scale
    const finalScale = visual.targetScale || neuron.size

    // Create timeline
    const timeline = gsap.timeline()

    // STAGE 1: Start as a tiny spark (0-0.3s)
    visual.mesh.scale.set(0.01, 0.01, 0.01)
    if (visual.glowMesh) {
      visual.glowMesh.scale.set(0.01, 0.01, 0.01)
    }

    // Initial flash
    const sparkMaterial = visual.mesh.material as THREE.ShaderMaterial
    if (sparkMaterial.uniforms?.glowIntensity) {
      timeline.fromTo(
        sparkMaterial.uniforms.glowIntensity,
        { value: 5.0 },
        {
          value: 1.0,
          duration: 0.4,
          ease: 'power2.out',
        },
        0
      )
    }

    // STAGE 2: Grow into full neuron (0.3-0.8s)
    timeline.to(
      visual.mesh.scale,
      {
        x: finalScale * 1.2,
        y: finalScale * 1.2,
        z: finalScale * 1.2,
        duration: 0.5,
        ease: 'back.out(2)',
      },
      0.1
    )

    // Overshoot and settle
    timeline.to(
      visual.mesh.scale,
      {
        x: finalScale,
        y: finalScale,
        z: finalScale,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)',
      },
      0.6
    )

    // Glow growth
    if (visual.glowMesh) {
      timeline.to(
        visual.glowMesh.scale,
        {
          x: 1.5,
          y: 1.5,
          z: 1.5,
          duration: 0.5,
          ease: 'back.out(2)',
        },
        0.1
      )

      timeline.to(
        visual.glowMesh.scale,
        {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 0.3,
          ease: 'elastic.out(1, 0.5)',
        },
        0.6
      )
    }

    // STAGE 3: Animate connections forming (0.6-1.2s)
    if (connections.length > 0) {
      connections.forEach((connection, index) => {
        const delay = 0.6 + index * 0.05
        this.animateConnectionFormationInternal(connection, timeline, delay)
      })
    }

    // STAGE 4: Gentle position settling (0.8-1.5s)
    // Slight random wobble before settling
    const wobbleX = (Math.random() - 0.5) * 0.3
    const wobbleY = (Math.random() - 0.5) * 0.3

    const finalPos = visual.mesh.position.clone()

    timeline.to(
      visual.mesh.position,
      {
        x: finalPos.x + wobbleX,
        y: finalPos.y + wobbleY,
        duration: 0.3,
        ease: 'power1.out',
      },
      0.8
    )

    timeline.to(
      visual.mesh.position,
      {
        x: finalPos.x,
        y: finalPos.y,
        z: finalPos.z,
        duration: 0.4,
        ease: 'elastic.out(1, 0.3)',
      },
      1.1
    )

    return new Promise((resolve) => {
      timeline.eventCallback('onComplete', () => resolve())
    })
  }

  /**
   * Animate a connection forming
   */
  async animateConnectionFormation(connection: ConnectionData): Promise<void> {
    const timeline = gsap.timeline()
    this.animateConnectionFormationInternal(connection, timeline, 0)

    return new Promise((resolve) => {
      timeline.eventCallback('onComplete', () => resolve())
    })
  }

  /**
   * Internal helper for connection formation
   */
  private animateConnectionFormationInternal(
    connection: ConnectionData,
    timeline: gsap.core.Timeline,
    delay: number
  ): void {
    const visual = this.connections.get(connection.id)
    if (!visual) return

    // Animate line drawing
    const lineMaterial = visual.line.material as THREE.LineBasicMaterial

    // Start invisible
    lineMaterial.opacity = 0

    // Fade in and draw
    timeline.to(
      lineMaterial,
      {
        opacity: 0.6 * connection.strength,
        duration: 0.4,
        ease: 'power2.out',
      },
      delay
    )

    // Pulse the connection
    timeline.to(
      lineMaterial,
      {
        opacity: 0.3 * connection.strength,
        duration: 0.2,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: 1,
      },
      delay + 0.4
    )

    // Animate particles if present
    if (visual.particles) {
      const particleMaterial = visual.particles.material as THREE.PointsMaterial

      particleMaterial.opacity = 0

      timeline.to(
        particleMaterial,
        {
          opacity: 0.8,
          duration: 0.3,
          ease: 'power2.out',
        },
        delay + 0.2
      )
    }
  }

  /**
   * Animate neuron spawning from another neuron (branching)
   */
  async animateBranching(
    parentNeuron: NeuronData,
    newNeuron: NeuronData,
    connection: ConnectionData
  ): Promise<void> {
    const parentVisual = this.neurons.get(parentNeuron.id)
    const newVisual = this.neurons.get(newNeuron.id)

    if (!parentVisual || !newVisual) {
      console.warn('Cannot animate branching: missing visuals')
      return
    }

    const timeline = gsap.timeline()

    // Start new neuron at parent position
    newVisual.mesh.position.copy(parentVisual.mesh.position)
    newVisual.mesh.scale.set(0.1, 0.1, 0.1)

    // Parent pulses
    timeline.to(
      parentVisual.mesh.scale,
      {
        x: parentVisual.targetScale * 1.3,
        y: parentVisual.targetScale * 1.3,
        z: parentVisual.targetScale * 1.3,
        duration: 0.3,
        ease: 'power2.out',
      },
      0
    )

    timeline.to(
      parentVisual.mesh.scale,
      {
        x: parentVisual.targetScale,
        y: parentVisual.targetScale,
        z: parentVisual.targetScale,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)',
      },
      0.3
    )

    // New neuron shoots out
    const finalPos = new THREE.Vector3(
      newNeuron.position.x,
      newNeuron.position.y,
      newNeuron.position.z
    )

    timeline.to(
      newVisual.mesh.position,
      {
        x: finalPos.x,
        y: finalPos.y,
        z: finalPos.z,
        duration: 0.6,
        ease: 'power2.out',
      },
      0.2
    )

    // Scale up while moving
    timeline.to(
      newVisual.mesh.scale,
      {
        x: newVisual.targetScale * 1.2,
        y: newVisual.targetScale * 1.2,
        z: newVisual.targetScale * 1.2,
        duration: 0.5,
        ease: 'back.out(2)',
      },
      0.2
    )

    timeline.to(
      newVisual.mesh.scale,
      {
        x: newVisual.targetScale,
        y: newVisual.targetScale,
        z: newVisual.targetScale,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)',
      },
      0.7
    )

    // Glow effects
    if (newVisual.glowMesh) {
      timeline.to(
        newVisual.glowMesh.scale,
        {
          x: 1.5,
          y: 1.5,
          z: 1.5,
          duration: 0.5,
          ease: 'power2.out',
        },
        0.2
      )

      timeline.to(
        newVisual.glowMesh.scale,
        {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 0.3,
          ease: 'power2.in',
        },
        0.7
      )
    }

    // Animate the connecting line
    this.animateConnectionFormationInternal(connection, timeline, 0.4)

    return new Promise((resolve) => {
      timeline.eventCallback('onComplete', () => resolve())
    })
  }

  /**
   * Quick spawn without elaborate animation (for bulk operations)
   */
  async quickSpawn(neuron: NeuronData): Promise<void> {
    const visual = this.neurons.get(neuron.id)
    if (!visual) return

    const finalScale = visual.targetScale || neuron.size

    visual.mesh.scale.set(0, 0, 0)
    if (visual.glowMesh) {
      visual.glowMesh.scale.set(0, 0, 0)
    }

    const timeline = gsap.timeline()

    timeline.to(visual.mesh.scale, {
      x: finalScale,
      y: finalScale,
      z: finalScale,
      duration: 0.4,
      ease: 'back.out(1.5)',
    })

    if (visual.glowMesh) {
      timeline.to(
        visual.glowMesh.scale,
        {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 0.4,
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
   * Clean up resources
   */
  dispose(): void {
    this.neurons.clear()
    this.connections.clear()
  }
}

export default GrowthAnimator

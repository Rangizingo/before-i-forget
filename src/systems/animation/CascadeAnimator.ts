import * as THREE from 'three'
import gsap from 'gsap'
import type { Vector3D } from '@/types/neural'

/**
 * Cascade configuration
 */
export interface CascadeConfig {
  delayPerNeuron: number // Delay between each neuron animation
  duration: number // Duration of each neuron's animation
  flashColor: number // Color for the completion flash
  waveSpeed: number // Speed of the cascade wave
  particleCount: number // Particles per neuron
}

/**
 * Default cascade configuration
 */
const DEFAULT_CONFIG: CascadeConfig = {
  delayPerNeuron: 0.08,
  duration: 0.6,
  flashColor: 0xfbbf24, // Golden/amber
  waveSpeed: 50, // units per second
  particleCount: 8,
}

/**
 * Cascade particle
 */
interface CascadeParticle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  life: number
  maxLife: number
}

/**
 * CascadeAnimator - Creates chain reaction animations for bulk completions
 * When multiple neurons are completed together, creates a satisfying cascade effect
 */
export class CascadeAnimator {
  private scene: THREE.Scene
  private config: CascadeConfig
  private particles: CascadeParticle[] = []
  private particleGeometry: THREE.SphereGeometry
  private particleMaterial: THREE.MeshBasicMaterial

  // Animation state
  private isAnimating = false
  private animationFrame: number | null = null

  constructor(scene: THREE.Scene, config?: Partial<CascadeConfig>) {
    this.scene = scene
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Create shared particle resources
    this.particleGeometry = new THREE.SphereGeometry(0.15, 8, 8)
    this.particleMaterial = new THREE.MeshBasicMaterial({
      color: this.config.flashColor,
      transparent: true,
      opacity: 1,
    })
  }

  /**
   * Trigger cascade animation for multiple neurons
   * @param positions Array of neuron positions in order of completion
   * @param meshes Optional array of neuron meshes to animate
   * @param onComplete Callback when cascade completes
   */
  triggerCascade(
    positions: Vector3D[],
    meshes?: THREE.Object3D[],
    onComplete?: () => void
  ): void {
    if (positions.length === 0) return

    this.isAnimating = true

    // Calculate cascade order based on distance from first neuron
    const sortedIndices = this.calculateCascadeOrder(positions)

    // Create timeline
    const timeline = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false
        onComplete?.()
      },
    })

    // Animate each neuron in cascade order
    sortedIndices.forEach((index, orderIndex) => {
      const position = positions[index]
      const mesh = meshes?.[index]
      const delay = orderIndex * this.config.delayPerNeuron

      // Add neuron animation to timeline
      timeline.add(() => {
        this.animateNeuronCompletion(position, mesh)
      }, delay)
    })

    // Start particle animation loop
    this.startParticleAnimation()
  }

  /**
   * Calculate cascade order - closest to source first
   */
  private calculateCascadeOrder(positions: Vector3D[]): number[] {
    if (positions.length <= 1) return [0]

    // Start from first position
    const source = positions[0]
    const distances: { index: number; distance: number }[] = positions.map((pos, index) => ({
      index,
      distance: this.getDistance(source, pos),
    }))

    // Sort by distance
    distances.sort((a, b) => a.distance - b.distance)

    return distances.map((d) => d.index)
  }

  /**
   * Get distance between two positions
   */
  private getDistance(a: Vector3D, b: Vector3D): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = a.z - b.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * Animate single neuron completion
   */
  private animateNeuronCompletion(position: Vector3D, mesh?: THREE.Object3D): void {
    // Create burst particles
    this.createBurstParticles(position)

    // Animate mesh if provided
    if (mesh && mesh instanceof THREE.Mesh) {
      // Flash effect
      const material = mesh.material
      const isSingleMaterial = material instanceof THREE.MeshBasicMaterial
      const originalColor = isSingleMaterial ? material.color.clone() : null

      if (originalColor && isSingleMaterial) {
        const mat = material as THREE.MeshBasicMaterial

        gsap.to(mat.color, {
          r: 0.98, // Golden
          g: 0.75,
          b: 0.14,
          duration: 0.15,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
          onComplete: () => {
            mat.color.copy(originalColor)
          },
        })
      }

      // Scale pulse
      gsap.to(mesh.scale, {
        x: 1.3,
        y: 1.3,
        z: 1.3,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: 'back.out(2)',
      })
    }
  }

  /**
   * Create burst particles at position
   */
  private createBurstParticles(position: Vector3D): void {
    for (let i = 0; i < this.config.particleCount; i++) {
      const mesh = new THREE.Mesh(
        this.particleGeometry,
        this.particleMaterial.clone()
      )

      mesh.position.set(position.x, position.y, position.z)

      // Random direction
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 2 + Math.random() * 3

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      )

      this.scene.add(mesh)

      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5,
      })
    }
  }

  /**
   * Start particle animation loop
   */
  private startParticleAnimation(): void {
    if (this.animationFrame !== null) return

    let lastTime = Date.now()

    const animate = () => {
      const now = Date.now()
      const deltaTime = (now - lastTime) / 1000
      lastTime = now

      this.updateParticles(deltaTime)

      if (this.particles.length > 0 || this.isAnimating) {
        this.animationFrame = requestAnimationFrame(animate)
      } else {
        this.animationFrame = null
      }
    }

    this.animationFrame = requestAnimationFrame(animate)
  }

  /**
   * Update particle positions and lifecycle
   */
  private updateParticles(deltaTime: number): void {
    const toRemove: number[] = []

    this.particles.forEach((particle, index) => {
      particle.life += deltaTime

      if (particle.life >= particle.maxLife) {
        toRemove.push(index)
        return
      }

      // Update position
      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      )

      // Apply gravity
      particle.velocity.y -= 5 * deltaTime

      // Fade out
      const progress = particle.life / particle.maxLife
      const material = particle.mesh.material as THREE.MeshBasicMaterial
      material.opacity = 1 - progress

      // Shrink
      const scale = 1 - progress * 0.5
      particle.mesh.scale.setScalar(scale)
    })

    // Remove dead particles (in reverse order to maintain indices)
    toRemove.reverse().forEach((index) => {
      const particle = this.particles[index]
      this.scene.remove(particle.mesh)
      if (particle.mesh.material instanceof THREE.Material) {
        particle.mesh.material.dispose()
      }
      this.particles.splice(index, 1)
    })
  }

  /**
   * Create ripple wave effect
   */
  createRippleWave(center: Vector3D, maxRadius: number = 30): void {
    const ringGeometry = new THREE.RingGeometry(0.1, 0.3, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: this.config.flashColor,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    })

    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.position.set(center.x, center.y, center.z)
    ring.lookAt(this.scene.position)

    this.scene.add(ring)

    // Animate ring expansion
    gsap.to(ring.scale, {
      x: maxRadius,
      y: maxRadius,
      z: 1,
      duration: 1.5,
      ease: 'power2.out',
    })

    gsap.to(ringMaterial, {
      opacity: 0,
      duration: 1.5,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(ring)
        ringGeometry.dispose()
        ringMaterial.dispose()
      },
    })
  }

  /**
   * Check if animation is in progress
   */
  isPlaying(): boolean {
    return this.isAnimating || this.particles.length > 0
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<CascadeConfig>): void {
    this.config = { ...this.config, ...config }
    this.particleMaterial.color.setHex(this.config.flashColor)
  }

  /**
   * Get current configuration
   */
  getConfig(): CascadeConfig {
    return { ...this.config }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    // Clean up particles
    this.particles.forEach((particle) => {
      this.scene.remove(particle.mesh)
      if (particle.mesh.material instanceof THREE.Material) {
        particle.mesh.material.dispose()
      }
    })
    this.particles = []

    this.particleGeometry.dispose()
    this.particleMaterial.dispose()
  }
}

export default CascadeAnimator

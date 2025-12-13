import * as THREE from 'three'

/**
 * Milestone thresholds
 */
export type MilestoneThreshold = 10 | 25 | 50 | 100 | 250 | 500 | 1000

/**
 * Milestone configuration
 */
export interface MilestoneConfig {
  thresholds: MilestoneThreshold[]
  celebrationDuration: number
  particleCount: Record<MilestoneThreshold, number>
  colors: Record<MilestoneThreshold, number>
}

/**
 * Milestone event data
 */
export interface MilestoneEvent {
  threshold: MilestoneThreshold
  currentCount: number
  previousCount: number
  isNewMilestone: boolean
}

/**
 * Default milestone configuration
 */
const DEFAULT_CONFIG: MilestoneConfig = {
  thresholds: [10, 25, 50, 100, 250, 500, 1000],
  celebrationDuration: 3,
  particleCount: {
    10: 30,
    25: 50,
    50: 80,
    100: 120,
    250: 200,
    500: 300,
    1000: 500,
  },
  colors: {
    10: 0x22c55e, // Green
    25: 0x3b82f6, // Blue
    50: 0x8b5cf6, // Purple
    100: 0xf59e0b, // Amber
    250: 0xef4444, // Red
    500: 0xec4899, // Pink
    1000: 0xfbbf24, // Gold
  },
}

/**
 * Celebration particle
 */
interface CelebrationParticle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  gravity: number
  life: number
  maxLife: number
}

/**
 * MilestoneManager - Tracks and celebrates network growth milestones
 * Shows special animations at 10, 50, 100, etc. neurons
 */
export class MilestoneManager {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private config: MilestoneConfig
  private reachedMilestones: Set<MilestoneThreshold> = new Set()
  private particles: CelebrationParticle[] = []
  private animationFrame: number | null = null

  // Callbacks
  private onMilestoneReached?: (event: MilestoneEvent) => void

  // Shared resources
  private particleGeometry: THREE.SphereGeometry
  private confettiGeometry: THREE.PlaneGeometry

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    config?: Partial<MilestoneConfig>
  ) {
    this.scene = scene
    this.camera = camera
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Create shared geometries
    this.particleGeometry = new THREE.SphereGeometry(0.2, 8, 8)
    this.confettiGeometry = new THREE.PlaneGeometry(0.4, 0.4)
  }

  /**
   * Set milestone callback
   */
  setOnMilestoneReached(callback: (event: MilestoneEvent) => void): void {
    this.onMilestoneReached = callback
  }

  /**
   * Check if a count has reached a new milestone
   */
  checkMilestone(currentCount: number, previousCount: number): MilestoneEvent | null {
    for (const threshold of this.config.thresholds) {
      if (currentCount >= threshold && previousCount < threshold && !this.reachedMilestones.has(threshold)) {
        this.reachedMilestones.add(threshold)

        const event: MilestoneEvent = {
          threshold,
          currentCount,
          previousCount,
          isNewMilestone: true,
        }

        this.onMilestoneReached?.(event)
        return event
      }
    }
    return null
  }

  /**
   * Trigger milestone celebration
   */
  celebrate(milestone: MilestoneThreshold, center?: THREE.Vector3): void {
    const particleCount = this.config.particleCount[milestone]
    const color = this.config.colors[milestone]

    // Default center is in front of camera
    const celebrationCenter = center || this.getCelebrationCenter()

    // Create celebration particles
    this.createCelebrationParticles(celebrationCenter, particleCount, color)

    // Create fireworks
    this.createFireworks(celebrationCenter, color)

    // Start animation loop
    this.startAnimation()
  }

  /**
   * Get center point for celebration (in front of camera)
   */
  private getCelebrationCenter(): THREE.Vector3 {
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(this.camera.quaternion)
    return this.camera.position.clone().add(direction.multiplyScalar(15))
  }

  /**
   * Create celebration particles (confetti)
   */
  private createCelebrationParticles(
    center: THREE.Vector3,
    count: number,
    baseColor: number
  ): void {
    const colors = [baseColor, 0xffffff, 0xfbbf24, 0xef4444, 0x22c55e]

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      })

      const mesh = new THREE.Mesh(this.confettiGeometry, material)

      // Random position around center
      mesh.position.set(
        center.x + (Math.random() - 0.5) * 10,
        center.y + Math.random() * 5,
        center.z + (Math.random() - 0.5) * 10
      )

      // Random rotation
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )

      // Random velocity (upward burst)
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        3 + Math.random() * 5,
        (Math.random() - 0.5) * 8
      )

      this.scene.add(mesh)

      this.particles.push({
        mesh,
        velocity,
        gravity: 3 + Math.random() * 2,
        life: 0,
        maxLife: 2 + Math.random() * 2,
      })
    }
  }

  /**
   * Create firework burst
   */
  private createFireworks(center: THREE.Vector3, color: number): void {
    const burstCount = 3

    for (let b = 0; b < burstCount; b++) {
      const burstDelay = b * 0.3
      const burstPosition = new THREE.Vector3(
        center.x + (Math.random() - 0.5) * 20,
        center.y + Math.random() * 10,
        center.z + (Math.random() - 0.5) * 20
      )

      setTimeout(() => {
        this.createBurst(burstPosition, color)
      }, burstDelay * 1000)
    }
  }

  /**
   * Create single firework burst
   */
  private createBurst(position: THREE.Vector3, color: number): void {
    const particleCount = 30
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    })

    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(this.particleGeometry, material.clone())
      mesh.position.copy(position)

      // Spherical burst pattern
      const phi = Math.random() * Math.PI * 2
      const theta = Math.random() * Math.PI
      const speed = 5 + Math.random() * 5

      const velocity = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi) * speed,
        Math.sin(theta) * Math.sin(phi) * speed,
        Math.cos(theta) * speed
      )

      this.scene.add(mesh)

      this.particles.push({
        mesh,
        velocity,
        gravity: 2,
        life: 0,
        maxLife: 1 + Math.random() * 1,
      })
    }
  }

  /**
   * Start animation loop
   */
  private startAnimation(): void {
    if (this.animationFrame !== null) return

    let lastTime = Date.now()

    const animate = () => {
      const now = Date.now()
      const deltaTime = (now - lastTime) / 1000
      lastTime = now

      this.updateParticles(deltaTime)

      if (this.particles.length > 0) {
        this.animationFrame = requestAnimationFrame(animate)
      } else {
        this.animationFrame = null
      }
    }

    this.animationFrame = requestAnimationFrame(animate)
  }

  /**
   * Update particles
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
      particle.velocity.y -= particle.gravity * deltaTime

      // Add rotation for confetti effect
      particle.mesh.rotation.x += deltaTime * 2
      particle.mesh.rotation.y += deltaTime * 3

      // Fade out
      const progress = particle.life / particle.maxLife
      const material = particle.mesh.material as THREE.MeshBasicMaterial
      material.opacity = 1 - Math.pow(progress, 2)
    })

    // Remove dead particles
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
   * Get milestone message
   */
  static getMilestoneMessage(milestone: MilestoneThreshold): string {
    const messages: Record<MilestoneThreshold, string> = {
      10: "First steps! Your network is growing.",
      25: "Quarter century! Great progress.",
      50: "Halfway to 100! Keep it up.",
      100: "Triple digits! Impressive network.",
      250: "Major milestone! Your thoughts are flourishing.",
      500: "Five hundred strong! Remarkable growth.",
      1000: "One thousand neurons! You're a neural network master!",
    }
    return messages[milestone]
  }

  /**
   * Get next milestone
   */
  getNextMilestone(currentCount: number): MilestoneThreshold | null {
    for (const threshold of this.config.thresholds) {
      if (currentCount < threshold) {
        return threshold
      }
    }
    return null
  }

  /**
   * Get progress to next milestone
   */
  getProgressToNextMilestone(currentCount: number): { next: MilestoneThreshold | null; progress: number } {
    const thresholds = this.config.thresholds
    let previousThreshold = 0

    for (const threshold of thresholds) {
      if (currentCount < threshold) {
        const range = threshold - previousThreshold
        const current = currentCount - previousThreshold
        return {
          next: threshold,
          progress: current / range,
        }
      }
      previousThreshold = threshold
    }

    return { next: null, progress: 1 }
  }

  /**
   * Check if animation is playing
   */
  isAnimating(): boolean {
    return this.particles.length > 0
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    this.particles.forEach((particle) => {
      this.scene.remove(particle.mesh)
      if (particle.mesh.material instanceof THREE.Material) {
        particle.mesh.material.dispose()
      }
    })
    this.particles = []

    this.particleGeometry.dispose()
    this.confettiGeometry.dispose()
  }
}

export default MilestoneManager

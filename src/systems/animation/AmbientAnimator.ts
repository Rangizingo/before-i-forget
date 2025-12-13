import gsap from 'gsap'
import * as THREE from 'three'
import type { SceneManager } from '@/systems/rendering'

/**
 * AmbientAnimator - Constant subtle background animation
 * Features:
 * - Floating particles
 * - Gentle camera drift
 * - Subtle color breathing/shifting
 * - Optimized for minimal CPU cost
 */

interface ParticleSystem {
  points: THREE.Points
  geometry: THREE.BufferGeometry
  material: THREE.ShaderMaterial
  velocities: Float32Array
}

export class AmbientAnimator {
  private sceneManager: SceneManager | null = null
  private isRunning = false
  private intensity = 0.5

  // Particle system
  private particleSystems: ParticleSystem[] = []
  private particleCount = 300

  // Camera drift
  private cameraDriftTimeline: gsap.core.Timeline | null = null
  private baseCamera: {
    position: THREE.Vector3
    lookAt: THREE.Vector3
  } | null = null

  // Update callback
  private updateUnsubscribe: (() => void) | null = null

  // Performance tracking
  private lastUpdateTime = 0
  private updateInterval = 1000 / 30 // 30 fps for ambient effects

  constructor() {}

  /**
   * Start ambient animations
   */
  start(sceneManager: SceneManager): void {
    if (this.isRunning) return

    this.sceneManager = sceneManager
    this.isRunning = true

    // Store initial camera state
    const camera = sceneManager.getCamera()
    this.baseCamera = {
      position: camera.position.clone(),
      lookAt: new THREE.Vector3(0, 0, 0),
    }

    // Initialize particle systems
    this.initializeParticles()

    // Start camera drift
    this.startCameraDrift()

    // Register update callback
    this.updateUnsubscribe = sceneManager.onUpdate(
      (delta: number, elapsed: number) => {
        this.update(delta, elapsed)
      }
    )
  }

  /**
   * Stop ambient animations
   */
  stop(): void {
    if (!this.isRunning) return

    this.isRunning = false

    // Stop camera drift
    if (this.cameraDriftTimeline) {
      this.cameraDriftTimeline.kill()
      this.cameraDriftTimeline = null
    }

    // Unregister update callback
    if (this.updateUnsubscribe) {
      this.updateUnsubscribe()
      this.updateUnsubscribe = null
    }

    // Clean up particles
    this.cleanupParticles()
  }

  /**
   * Set ambient intensity (0-1)
   */
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity))

    // Update particle opacity
    this.particleSystems.forEach((system) => {
      if (system.material.uniforms.scale) {
        system.material.uniforms.scale.value = this.intensity
      }
    })
  }

  /**
   * Initialize particle systems
   */
  private initializeParticles(): void {
    if (!this.sceneManager) return

    const colors = [
      new THREE.Color(0x6644ff),
      new THREE.Color(0x44aaff),
      new THREE.Color(0xff44aa),
    ]

    colors.forEach((color) => {
      const positions = new Float32Array(this.particleCount * 3)
      const sizes = new Float32Array(this.particleCount)
      const phases = new Float32Array(this.particleCount)
      const velocities = new Float32Array(this.particleCount * 3)

      for (let i = 0; i < this.particleCount; i++) {
        // Random position in a large sphere
        const radius = 30 + Math.random() * 100
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = radius * Math.cos(phi)

        // Random size
        sizes[i] = 2 + Math.random() * 4

        // Random phase for animation variation
        phases[i] = Math.random() * Math.PI * 2

        // Slow random drift
        velocities[i * 3] = (Math.random() - 0.5) * 0.02
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('particleSize', new THREE.BufferAttribute(sizes, 1))
      geometry.setAttribute('particlePhase', new THREE.BufferAttribute(phases, 1))

      // Create shader material for particles
      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: color },
          time: { value: 0 },
          scale: { value: this.intensity },
        },
        vertexShader: `
          attribute float particleSize;
          attribute float particlePhase;
          uniform float time;
          uniform float scale;
          varying float vAlpha;

          void main() {
            vec3 pos = position;

            // Slow floating motion
            pos.x += sin(time * 0.3 + particlePhase) * 2.0;
            pos.y += cos(time * 0.2 + particlePhase * 1.3) * 2.0;
            pos.z += sin(time * 0.25 + particlePhase * 0.7) * 1.5;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

            // Distance fade
            float distFade = 1.0 - smoothstep(50.0, 150.0, -mvPosition.z);

            // Gentle pulsing
            float pulse = 0.3 + 0.7 * sin(time * 0.5 + particlePhase * 2.0);
            vAlpha = distFade * pulse * 0.3 * scale;

            gl_PointSize = particleSize * scale * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          varying float vAlpha;

          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);

            if (dist > 0.5) discard;

            float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const points = new THREE.Points(geometry, material)
      points.renderOrder = -1 // Render behind everything

      if (this.sceneManager) {
        this.sceneManager.add(points)
      }

      this.particleSystems.push({
        points,
        geometry,
        material,
        velocities,
      })
    })
  }

  /**
   * Start gentle camera drift
   */
  private startCameraDrift(): void {
    if (!this.sceneManager || !this.baseCamera) return

    const camera = this.sceneManager.getCamera()

    this.cameraDriftTimeline = gsap.timeline({
      repeat: -1,
      yoyo: true,
    })

    const driftAmount = 2.0 * this.intensity

    // Drift in X
    this.cameraDriftTimeline.to(camera.position, {
      x: this.baseCamera.position.x + driftAmount,
      duration: 8,
      ease: 'sine.inOut',
    })

    // Drift in Y (offset timing)
    this.cameraDriftTimeline.to(
      camera.position,
      {
        y: this.baseCamera.position.y + driftAmount * 0.5,
        duration: 10,
        ease: 'sine.inOut',
      },
      0
    )

    // Slight rotation drift
    this.cameraDriftTimeline.to(
      camera.rotation,
      {
        z: 0.02 * this.intensity,
        duration: 12,
        ease: 'sine.inOut',
      },
      0
    )
  }

  /**
   * Update animations (called each frame)
   */
  private update(delta: number, elapsed: number): void {
    if (!this.isRunning) return

    // Throttle updates for performance
    const now = performance.now()
    if (now - this.lastUpdateTime < this.updateInterval) {
      return
    }
    this.lastUpdateTime = now

    // Update particle systems
    this.particleSystems.forEach((system) => {
      // Update time uniform
      if (system.material.uniforms.time) {
        system.material.uniforms.time.value = elapsed
      }

      // Gentle drift (optional, shader handles most of it)
      const positionAttr = system.geometry.attributes.position
      if (!positionAttr) return

      const positions = positionAttr.array as Float32Array

      for (let i = 0; i < this.particleCount; i++) {
        positions[i * 3] += system.velocities[i * 3] * delta
        positions[i * 3 + 1] += system.velocities[i * 3 + 1] * delta
        positions[i * 3 + 2] += system.velocities[i * 3 + 2] * delta

        // Wrap around to keep particles in bounds
        const radius = Math.sqrt(
          positions[i * 3] ** 2 +
            positions[i * 3 + 1] ** 2 +
            positions[i * 3 + 2] ** 2
        )

        if (radius > 150) {
          // Reset to inner sphere
          const scale = 50 / radius
          positions[i * 3] *= scale
          positions[i * 3 + 1] *= scale
          positions[i * 3 + 2] *= scale
        }
      }

      system.geometry.attributes.position.needsUpdate = true
    })
  }

  /**
   * Create a brief ambient pulse (e.g., on user interaction)
   */
  createPulse(position: THREE.Vector3, color: THREE.Color): void {
    if (!this.sceneManager) return

    // Create expanding ring
    const geometry = new THREE.RingGeometry(0.1, 0.5, 32)
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    })

    const ring = new THREE.Mesh(geometry, material)
    ring.position.copy(position)
    ring.lookAt(this.sceneManager.getCamera().position)

    this.sceneManager.add(ring)

    const timeline = gsap.timeline()

    // Expand
    timeline.to(ring.scale, {
      x: 5.0,
      y: 5.0,
      z: 5.0,
      duration: 1.0,
      ease: 'power2.out',
    })

    // Fade out
    timeline.to(
      material,
      {
        opacity: 0,
        duration: 1.0,
        ease: 'power2.in',
        onComplete: () => {
          this.sceneManager?.remove(ring)
          geometry.dispose()
          material.dispose()
        },
      },
      0
    )
  }

  /**
   * Clean up particle systems
   */
  private cleanupParticles(): void {
    this.particleSystems.forEach((system) => {
      this.sceneManager?.remove(system.points)
      system.geometry.dispose()
      system.material.dispose()
    })
    this.particleSystems = []
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.stop()
  }
}

export default AmbientAnimator

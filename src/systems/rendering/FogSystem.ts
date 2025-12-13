import * as THREE from 'three'

/**
 * Fog configuration
 */
export interface FogConfig {
  enabled: boolean
  color: number
  near: number // Distance where fog starts
  far: number // Distance where fog is fully opaque
  density: number // For exponential fog
  type: 'linear' | 'exponential'
}

/**
 * Default fog configuration
 */
const DEFAULT_CONFIG: FogConfig = {
  enabled: true,
  color: 0x0a0a1a, // Dark blue matching background
  near: 50,
  far: 150,
  density: 0.015,
  type: 'exponential',
}

/**
 * FogSystem - Creates atmospheric depth with edge fade effects
 * Neurons fade into the background at distance for a dreamy, neural aesthetic
 */
export class FogSystem {
  private scene: THREE.Scene
  private config: FogConfig

  // Shader uniforms for custom fog
  private fogUniforms: {
    fogColor: THREE.Uniform<THREE.Color>
    fogNear: THREE.Uniform<number>
    fogFar: THREE.Uniform<number>
    fogDensity: THREE.Uniform<number>
  }

  constructor(scene: THREE.Scene, config?: Partial<FogConfig>) {
    this.scene = scene
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Initialize fog uniforms for custom shaders
    this.fogUniforms = {
      fogColor: new THREE.Uniform(new THREE.Color(this.config.color)),
      fogNear: new THREE.Uniform(this.config.near),
      fogFar: new THREE.Uniform(this.config.far),
      fogDensity: new THREE.Uniform(this.config.density),
    }

    // Apply initial fog
    if (this.config.enabled) {
      this.enable()
    }
  }

  /**
   * Enable fog effect
   */
  enable(): void {
    this.config.enabled = true

    if (this.config.type === 'linear') {
      this.scene.fog = new THREE.Fog(
        this.config.color,
        this.config.near,
        this.config.far
      )
    } else {
      this.scene.fog = new THREE.FogExp2(
        this.config.color,
        this.config.density
      )
    }
  }

  /**
   * Disable fog effect
   */
  disable(): void {
    this.config.enabled = false
    this.scene.fog = null
  }

  /**
   * Toggle fog on/off
   */
  toggle(): boolean {
    if (this.config.enabled) {
      this.disable()
    } else {
      this.enable()
    }
    return this.config.enabled
  }

  /**
   * Set fog color
   */
  setColor(color: number): void {
    this.config.color = color
    this.fogUniforms.fogColor.value.setHex(color)

    if (this.scene.fog) {
      this.scene.fog.color.setHex(color)
    }
  }

  /**
   * Set fog near distance (linear fog)
   */
  setNear(near: number): void {
    this.config.near = near
    this.fogUniforms.fogNear.value = near

    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.near = near
    }
  }

  /**
   * Set fog far distance (linear fog)
   */
  setFar(far: number): void {
    this.config.far = far
    this.fogUniforms.fogFar.value = far

    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.far = far
    }
  }

  /**
   * Set fog density (exponential fog)
   */
  setDensity(density: number): void {
    this.config.density = density
    this.fogUniforms.fogDensity.value = density

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = density
    }
  }

  /**
   * Set fog type and recreate fog
   */
  setType(type: 'linear' | 'exponential'): void {
    this.config.type = type
    if (this.config.enabled) {
      this.enable() // Recreate fog with new type
    }
  }

  /**
   * Update fog based on camera distance
   * Dynamically adjusts fog intensity for depth perception
   */
  updateForCamera(camera: THREE.Camera, sceneCenter: THREE.Vector3): void {
    const distance = camera.position.distanceTo(sceneCenter)

    // Adjust fog based on zoom level
    const zoomFactor = Math.max(0.5, Math.min(2, distance / 50))

    if (this.config.type === 'linear') {
      this.setNear(this.config.near * zoomFactor)
      this.setFar(this.config.far * zoomFactor)
    } else {
      this.setDensity(this.config.density / zoomFactor)
    }
  }

  /**
   * Get fog uniforms for custom shaders
   */
  getUniforms(): typeof this.fogUniforms {
    return this.fogUniforms
  }

  /**
   * Get custom fog shader chunk for vertex shader
   */
  static getVertexShaderChunk(): string {
    return `
      varying float vFogDepth;

      void calculateFogDepth() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vFogDepth = -mvPosition.z;
      }
    `
  }

  /**
   * Get custom fog shader chunk for fragment shader
   */
  static getFragmentShaderChunk(): string {
    return `
      uniform vec3 fogColor;
      uniform float fogNear;
      uniform float fogFar;
      uniform float fogDensity;
      varying float vFogDepth;

      vec4 applyFog(vec4 color) {
        #ifdef USE_LINEAR_FOG
          float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
        #else
          float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        #endif

        return vec4(mix(color.rgb, fogColor, fogFactor), color.a);
      }
    `
  }

  /**
   * Create fog-enabled material from existing material
   */
  createFogMaterial(baseMaterial: THREE.Material): THREE.Material {
    const material = baseMaterial.clone()
    // Most Three.js materials support fog property
    if ('fog' in material) {
      (material as THREE.MeshBasicMaterial).fog = true
    }
    return material
  }

  /**
   * Apply fog to all meshes in a group
   */
  applyToGroup(group: THREE.Group): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat) => {
          if ('fog' in mat) {
            (mat as THREE.MeshBasicMaterial).fog = true
          }
        })
      }
    })
  }

  /**
   * Get current configuration
   */
  getConfig(): FogConfig {
    return { ...this.config }
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<FogConfig>): void {
    const wasEnabled = this.config.enabled
    this.config = { ...this.config, ...config }

    // Update uniforms
    if (config.color !== undefined) this.setColor(config.color)
    if (config.near !== undefined) this.setNear(config.near)
    if (config.far !== undefined) this.setFar(config.far)
    if (config.density !== undefined) this.setDensity(config.density)
    if (config.type !== undefined) this.setType(config.type)

    // Handle enable/disable
    if (config.enabled !== undefined && config.enabled !== wasEnabled) {
      if (config.enabled) {
        this.enable()
      } else {
        this.disable()
      }
    }
  }

  /**
   * Transition fog settings smoothly
   */
  async transitionTo(
    targetConfig: Partial<FogConfig>,
    duration: number = 1000
  ): Promise<void> {
    const startConfig = { ...this.config }
    const startTime = Date.now()

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = this.easeInOutCubic(progress)

        // Interpolate numeric values
        if (targetConfig.near !== undefined) {
          this.setNear(this.lerp(startConfig.near, targetConfig.near, eased))
        }
        if (targetConfig.far !== undefined) {
          this.setFar(this.lerp(startConfig.far, targetConfig.far, eased))
        }
        if (targetConfig.density !== undefined) {
          this.setDensity(this.lerp(startConfig.density, targetConfig.density, eased))
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // Apply final values
          if (targetConfig.color !== undefined) this.setColor(targetConfig.color)
          if (targetConfig.type !== undefined) this.setType(targetConfig.type)
          if (targetConfig.enabled !== undefined) {
            if (targetConfig.enabled) this.enable()
            else this.disable()
          }
          resolve()
        }
      }

      animate()
    })
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  /**
   * Ease in out cubic
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.disable()
  }
}

export default FogSystem

import * as THREE from 'three'
import type {
  RenderConfig,
  CameraConfig,
  SceneConfig,
  PerformanceMetrics,
} from '@/types/neural'

/**
 * SceneManager - Core Three.js scene management
 * Handles WebGL renderer, camera, scene setup, and render loop
 */
export class SceneManager {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private container: HTMLElement
  private animationFrameId: number | null = null
  private isRunning = false
  private clock: THREE.Clock
  private updateCallbacks: Set<(delta: number, elapsed: number) => void> = new Set()
  private resizeObserver: ResizeObserver | null = null

  // Performance tracking
  private frameCount = 0
  private lastFpsUpdate = 0
  private currentFps = 60

  constructor(
    container: HTMLElement,
    renderConfig?: Partial<RenderConfig>,
    cameraConfig?: Partial<CameraConfig>,
    sceneConfig?: Partial<SceneConfig>
  ) {
    this.container = container
    this.clock = new THREE.Clock()

    // Merge configs with defaults
    const render: RenderConfig = {
      width: container.clientWidth,
      height: container.clientHeight,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      antialias: true,
      alpha: true,
      ...renderConfig,
    }

    const cam: CameraConfig = {
      fov: 60,
      near: 0.1,
      far: 1000,
      position: { x: 0, y: 0, z: 50 },
      lookAt: { x: 0, y: 0, z: 0 },
      ...cameraConfig,
    }

    const scn: SceneConfig = {
      backgroundColor: 0x0a0a1a,
      ambientLightIntensity: 0.4,
      ...sceneConfig,
    }

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: render.antialias,
      alpha: render.alpha,
      powerPreference: 'high-performance',
    })
    this.renderer.setSize(render.width, render.height)
    this.renderer.setPixelRatio(render.pixelRatio)
    this.renderer.setClearColor(scn.backgroundColor, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(this.renderer.domElement)

    // Initialize scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(scn.backgroundColor)

    // Add fog for depth effect
    if (scn.fog) {
      this.scene.fog = new THREE.Fog(scn.fog.color, scn.fog.near, scn.fog.far)
    }

    // Initialize camera
    const aspect = render.width / render.height
    this.camera = new THREE.PerspectiveCamera(cam.fov, aspect, cam.near, cam.far)
    this.camera.position.set(cam.position.x, cam.position.y, cam.position.z)
    this.camera.lookAt(cam.lookAt.x, cam.lookAt.y, cam.lookAt.z)

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, scn.ambientLightIntensity)
    this.scene.add(ambientLight)

    // Setup resize handling
    this.setupResizeObserver()
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          this.handleResize(width, height)
        }
      }
    })
    this.resizeObserver.observe(this.container)
  }

  private handleResize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  /**
   * Start the render loop
   */
  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.clock.start()
    this.animate()
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return

    this.animationFrameId = requestAnimationFrame(this.animate)

    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    // Update FPS counter
    this.frameCount++
    if (elapsed - this.lastFpsUpdate >= 1) {
      this.currentFps = this.frameCount / (elapsed - this.lastFpsUpdate)
      this.frameCount = 0
      this.lastFpsUpdate = elapsed
    }

    // Call all registered update callbacks
    this.updateCallbacks.forEach((callback) => callback(delta, elapsed))

    // Render the scene
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Register an update callback to be called every frame
   */
  onUpdate(callback: (delta: number, elapsed: number) => void): () => void {
    this.updateCallbacks.add(callback)
    return () => this.updateCallbacks.delete(callback)
  }

  /**
   * Add an object to the scene
   */
  add(object: THREE.Object3D): void {
    this.scene.add(object)
  }

  /**
   * Remove an object from the scene
   */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object)
  }

  /**
   * Get the Three.js scene
   */
  getScene(): THREE.Scene {
    return this.scene
  }

  /**
   * Get the Three.js camera
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  /**
   * Get the Three.js renderer
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  /**
   * Get the container element
   */
  getContainer(): HTMLElement {
    return this.container
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const info = this.renderer.info
    return {
      fps: Math.round(this.currentFps),
      frameTime: 1000 / this.currentFps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      visibleNeurons: 0, // Will be updated by neural renderer
      visibleConnections: 0,
    }
  }

  /**
   * Set background color
   */
  setBackgroundColor(color: number): void {
    this.scene.background = new THREE.Color(color)
    this.renderer.setClearColor(color, 1)
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX: number, screenY: number, z = 0): THREE.Vector3 {
    const rect = this.container.getBoundingClientRect()
    const x = ((screenX - rect.left) / rect.width) * 2 - 1
    const y = -((screenY - rect.top) / rect.height) * 2 + 1

    const vector = new THREE.Vector3(x, y, 0.5)
    vector.unproject(this.camera)

    const dir = vector.sub(this.camera.position).normalize()
    const distance = (z - this.camera.position.z) / dir.z
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance))

    return pos
  }

  /**
   * Raycast from screen coordinates
   */
  raycast(screenX: number, screenY: number, objects: THREE.Object3D[]): THREE.Intersection[] {
    const rect = this.container.getBoundingClientRect()
    const x = ((screenX - rect.left) / rect.width) * 2 - 1
    const y = -((screenY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera)

    return raycaster.intersectObjects(objects, true)
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.stop()

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    // Clear update callbacks
    this.updateCallbacks.clear()

    // Dispose of scene objects
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        } else if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose())
        }
      }
    })

    // Dispose renderer
    this.renderer.dispose()

    // Remove canvas from DOM
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}

export default SceneManager

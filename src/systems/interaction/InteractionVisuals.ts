import * as THREE from 'three'

export interface VisualOptions {
  hoverGlowColor?: number
  hoverGlowIntensity?: number
  selectionRingColor?: number
  selectionRingThickness?: number
  dragGhostOpacity?: number
}

/**
 * InteractionVisuals - Visual feedback for interactions
 * Manages hover glow, selection rings, and drag ghost effects
 */
export class InteractionVisuals {
  private scene: THREE.Scene
  private options: Required<VisualOptions>

  // Visual elements
  private hoverGlow: THREE.Mesh | null = null
  private selectionRing: THREE.LineLoop | null = null
  private dragGhost: THREE.Mesh | null = null

  // Current targets
  private hoveredObject: THREE.Object3D | null = null
  private selectedObject: THREE.Object3D | null = null

  // Animation state
  private glowPhase = 0
  private ringPhase = 0

  constructor(scene: THREE.Scene, options: VisualOptions = {}) {
    this.scene = scene

    this.options = {
      hoverGlowColor: 0x06b6d4, // Cyan
      hoverGlowIntensity: 0.4,
      selectionRingColor: 0x8b5cf6, // Purple
      selectionRingThickness: 0.1,
      dragGhostOpacity: 0.3,
      ...options,
    }
  }

  /**
   * Show hover glow on an object
   */
  showHover(object: THREE.Object3D | null): void {
    // Remove existing hover glow
    if (this.hoverGlow) {
      this.scene.remove(this.hoverGlow)
      this.hoverGlow.geometry.dispose()
      if (this.hoverGlow.material instanceof THREE.Material) {
        this.hoverGlow.material.dispose()
      }
      this.hoverGlow = null
    }

    this.hoveredObject = object

    if (!object) return

    // Create hover glow
    const size = this.getObjectSize(object)
    const geometry = new THREE.SphereGeometry(size * 1.3, 32, 32)
    const material = new THREE.MeshBasicMaterial({
      color: this.options.hoverGlowColor,
      transparent: true,
      opacity: this.options.hoverGlowIntensity,
      depthWrite: false,
    })

    this.hoverGlow = new THREE.Mesh(geometry, material)
    this.hoverGlow.position.copy(object.position)
    this.scene.add(this.hoverGlow)
  }

  /**
   * Show selection ring around an object
   */
  showSelection(object: THREE.Object3D | null): void {
    // Remove existing selection ring
    if (this.selectionRing) {
      this.scene.remove(this.selectionRing)
      this.selectionRing.geometry.dispose()
      if (this.selectionRing.material instanceof THREE.Material) {
        this.selectionRing.material.dispose()
      }
      this.selectionRing = null
    }

    this.selectedObject = object

    if (!object) return

    // Create selection ring
    const size = this.getObjectSize(object)
    const ringRadius = size * 1.5
    const segments = 64
    const points: THREE.Vector3[] = []

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * ringRadius,
          Math.sin(angle) * ringRadius,
          0
        )
      )
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: this.options.selectionRingColor,
      linewidth: this.options.selectionRingThickness,
      transparent: true,
      opacity: 0.8,
    })

    this.selectionRing = new THREE.LineLoop(geometry, material)
    this.selectionRing.position.copy(object.position)

    // Make ring face the camera (billboard effect)
    this.selectionRing.lookAt(this.scene.position)

    this.scene.add(this.selectionRing)
  }

  /**
   * Show drag ghost while dragging
   */
  showDragGhost(object: THREE.Object3D | null, position?: THREE.Vector3): void {
    // Remove existing drag ghost
    if (this.dragGhost) {
      this.scene.remove(this.dragGhost)
      this.dragGhost.geometry.dispose()
      if (this.dragGhost.material instanceof THREE.Material) {
        this.dragGhost.material.dispose()
      }
      this.dragGhost = null
    }

    if (!object || !position) return

    // Create drag ghost
    const size = this.getObjectSize(object)
    const geometry = new THREE.SphereGeometry(size, 24, 24)
    const material = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: this.options.dragGhostOpacity,
      depthWrite: false,
    })

    this.dragGhost = new THREE.Mesh(geometry, material)
    this.dragGhost.position.copy(position)
    this.scene.add(this.dragGhost)
  }

  /**
   * Update drag ghost position
   */
  updateDragGhost(position: THREE.Vector3): void {
    if (this.dragGhost) {
      this.dragGhost.position.copy(position)
    }
  }

  /**
   * Hide drag ghost
   */
  hideDragGhost(): void {
    if (this.dragGhost) {
      this.scene.remove(this.dragGhost)
      this.dragGhost.geometry.dispose()
      if (this.dragGhost.material instanceof THREE.Material) {
        this.dragGhost.material.dispose()
      }
      this.dragGhost = null
    }
  }

  /**
   * Update animations (call every frame)
   */
  update(delta: number): void {
    this.glowPhase += delta * 2
    this.ringPhase += delta * 1.5

    // Animate hover glow
    if (this.hoverGlow) {
      const pulseScale = 1 + Math.sin(this.glowPhase) * 0.1
      this.hoverGlow.scale.set(pulseScale, pulseScale, pulseScale)

      const pulseOpacity = this.options.hoverGlowIntensity * (0.8 + Math.sin(this.glowPhase * 1.5) * 0.2)
      if (this.hoverGlow.material instanceof THREE.MeshBasicMaterial) {
        this.hoverGlow.material.opacity = pulseOpacity
      }

      // Update position if hovered object moved
      if (this.hoveredObject) {
        this.hoverGlow.position.copy(this.hoveredObject.position)
      }
    }

    // Animate selection ring
    if (this.selectionRing) {
      this.selectionRing.rotation.z += delta * 0.5

      const ringScale = 1 + Math.sin(this.ringPhase) * 0.05
      this.selectionRing.scale.set(ringScale, ringScale, ringScale)

      // Update position if selected object moved
      if (this.selectedObject) {
        this.selectionRing.position.copy(this.selectedObject.position)
      }
    }

    // Animate drag ghost
    if (this.dragGhost) {
      const ghostPulse = 1 + Math.sin(this.glowPhase * 3) * 0.15
      this.dragGhost.scale.set(ghostPulse, ghostPulse, ghostPulse)
    }
  }

  /**
   * Get approximate size of an object
   */
  private getObjectSize(object: THREE.Object3D): number {
    const box = new THREE.Box3().setFromObject(object)
    const size = new THREE.Vector3()
    box.getSize(size)
    return Math.max(size.x, size.y, size.z) / 2
  }

  /**
   * Set hover glow color
   */
  setHoverColor(color: number): void {
    this.options.hoverGlowColor = color
    if (this.hoverGlow && this.hoverGlow.material instanceof THREE.MeshBasicMaterial) {
      this.hoverGlow.material.color.setHex(color)
    }
  }

  /**
   * Set selection ring color
   */
  setSelectionColor(color: number): void {
    this.options.selectionRingColor = color
    if (this.selectionRing && this.selectionRing.material instanceof THREE.LineBasicMaterial) {
      this.selectionRing.material.color.setHex(color)
    }
  }

  /**
   * Clear all visual effects
   */
  clearAll(): void {
    this.showHover(null)
    this.showSelection(null)
    this.hideDragGhost()
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.clearAll()
  }
}

export default InteractionVisuals

import * as THREE from 'three'
import type { Vector3D } from '@/types/neural'

/**
 * LOD Level definitions
 */
export interface LODLevel {
  distance: number
  neuronSegments: number
  connectionSegments: number
  showGlow: boolean
  showParticles: boolean
}

/**
 * Default LOD configuration
 */
const DEFAULT_LOD_LEVELS: LODLevel[] = [
  { distance: 0, neuronSegments: 32, connectionSegments: 20, showGlow: true, showParticles: true },
  { distance: 30, neuronSegments: 16, connectionSegments: 10, showGlow: true, showParticles: false },
  { distance: 60, neuronSegments: 8, connectionSegments: 5, showGlow: false, showParticles: false },
  { distance: 100, neuronSegments: 4, connectionSegments: 2, showGlow: false, showParticles: false },
]

/**
 * LOD object info
 */
export interface LODObjectInfo {
  id: string
  position: Vector3D
  currentLevel: number
  mesh: THREE.Object3D | null
}

/**
 * LODManager - Level of Detail system for performance optimization
 * Manages geometry complexity based on distance from camera
 */
export class LODManager {
  private camera: THREE.Camera
  private levels: LODLevel[]
  private objects: Map<string, LODObjectInfo> = new Map()

  // Geometry caches for each LOD level
  private neuronGeometries: Map<number, THREE.SphereGeometry> = new Map()
  private pointGeometry: THREE.BufferGeometry | null = null

  // Update throttling
  private lastUpdateTime = 0
  private updateInterval = 100 // ms between LOD updates

  constructor(camera: THREE.Camera, levels?: LODLevel[]) {
    this.camera = camera
    this.levels = levels || DEFAULT_LOD_LEVELS
    this.initGeometries()
  }

  /**
   * Initialize cached geometries for each LOD level
   */
  private initGeometries(): void {
    this.levels.forEach((level, index) => {
      const geometry = new THREE.SphereGeometry(1, level.neuronSegments, level.neuronSegments)
      this.neuronGeometries.set(index, geometry)
    })

    // Create point geometry for very distant neurons
    this.pointGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array([0, 0, 0])
    this.pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  }

  /**
   * Register an object for LOD management
   */
  registerObject(id: string, position: Vector3D, mesh: THREE.Object3D | null = null): void {
    this.objects.set(id, {
      id,
      position,
      currentLevel: 0,
      mesh,
    })
  }

  /**
   * Unregister an object
   */
  unregisterObject(id: string): void {
    this.objects.delete(id)
  }

  /**
   * Update object position
   */
  updatePosition(id: string, position: Vector3D): void {
    const obj = this.objects.get(id)
    if (obj) {
      obj.position = position
    }
  }

  /**
   * Update object mesh reference
   */
  updateMesh(id: string, mesh: THREE.Object3D): void {
    const obj = this.objects.get(id)
    if (obj) {
      obj.mesh = mesh
    }
  }

  /**
   * Get LOD level for a given distance
   */
  getLevelForDistance(distance: number): number {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (distance >= this.levels[i].distance) {
        return i
      }
    }
    return 0
  }

  /**
   * Get LOD configuration for a level
   */
  getLevelConfig(level: number): LODLevel {
    return this.levels[Math.min(level, this.levels.length - 1)]
  }

  /**
   * Get cached geometry for a LOD level
   */
  getGeometry(level: number): THREE.BufferGeometry {
    const geometry = this.neuronGeometries.get(level)
    if (geometry) return geometry

    // Fallback to highest detail
    return this.neuronGeometries.get(0) || new THREE.SphereGeometry(1, 32, 32)
  }

  /**
   * Calculate distance from camera to a position
   */
  private getDistanceToCamera(position: Vector3D): number {
    const cameraPos = this.camera.position
    const dx = position.x - cameraPos.x
    const dy = position.y - cameraPos.y
    const dz = position.z - cameraPos.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * Update LOD levels for all objects
   * Returns list of objects that changed LOD level
   */
  update(): Array<{ id: string; oldLevel: number; newLevel: number; config: LODLevel }> {
    const now = Date.now()

    // Throttle updates
    if (now - this.lastUpdateTime < this.updateInterval) {
      return []
    }
    this.lastUpdateTime = now

    const changes: Array<{ id: string; oldLevel: number; newLevel: number; config: LODLevel }> = []

    this.objects.forEach((obj) => {
      const distance = this.getDistanceToCamera(obj.position)
      const newLevel = this.getLevelForDistance(distance)

      if (newLevel !== obj.currentLevel) {
        changes.push({
          id: obj.id,
          oldLevel: obj.currentLevel,
          newLevel,
          config: this.levels[newLevel],
        })
        obj.currentLevel = newLevel
      }
    })

    return changes
  }

  /**
   * Get current LOD level for an object
   */
  getObjectLevel(id: string): number {
    return this.objects.get(id)?.currentLevel ?? 0
  }

  /**
   * Get current LOD config for an object
   */
  getObjectConfig(id: string): LODLevel {
    const level = this.getObjectLevel(id)
    return this.getLevelConfig(level)
  }

  /**
   * Check if object should show glow at current LOD
   */
  shouldShowGlow(id: string): boolean {
    return this.getObjectConfig(id).showGlow
  }

  /**
   * Check if object should show particles at current LOD
   */
  shouldShowParticles(id: string): boolean {
    return this.getObjectConfig(id).showParticles
  }

  /**
   * Get neuron segments for current LOD
   */
  getNeuronSegments(id: string): number {
    return this.getObjectConfig(id).neuronSegments
  }

  /**
   * Get statistics
   */
  getStats(): { total: number; byLevel: Record<number, number> } {
    const byLevel: Record<number, number> = {}

    this.objects.forEach((obj) => {
      byLevel[obj.currentLevel] = (byLevel[obj.currentLevel] || 0) + 1
    })

    return {
      total: this.objects.size,
      byLevel,
    }
  }

  /**
   * Set update interval
   */
  setUpdateInterval(ms: number): void {
    this.updateInterval = ms
  }

  /**
   * Force immediate update (ignores throttle)
   */
  forceUpdate(): Array<{ id: string; oldLevel: number; newLevel: number; config: LODLevel }> {
    this.lastUpdateTime = 0
    return this.update()
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.neuronGeometries.forEach((geometry) => geometry.dispose())
    this.neuronGeometries.clear()

    this.pointGeometry?.dispose()
    this.pointGeometry = null

    this.objects.clear()
  }
}

export default LODManager

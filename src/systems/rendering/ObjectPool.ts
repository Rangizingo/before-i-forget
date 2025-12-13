import * as THREE from 'three'

/**
 * Pool configuration
 */
export interface PoolConfig {
  initialSize: number
  maxSize: number
  growthFactor: number
}

/**
 * Generic object pool for reusing Three.js objects
 */
export class ObjectPool<T> {
  private available: T[] = []
  private inUse: Set<T> = new Set()
  private factory: () => T
  private reset: (obj: T) => void
  private maxSize: number

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory
    this.reset = reset
    this.maxSize = maxSize

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory())
    }
  }

  /**
   * Get an object from the pool
   */
  acquire(): T {
    let obj: T

    if (this.available.length > 0) {
      obj = this.available.pop()!
    } else if (this.inUse.size < this.maxSize) {
      obj = this.factory()
    } else {
      // Pool exhausted, create temporary object
      console.warn('ObjectPool: max size reached, creating temporary object')
      obj = this.factory()
    }

    this.inUse.add(obj)
    return obj
  }

  /**
   * Return an object to the pool
   */
  release(obj: T): void {
    if (!this.inUse.has(obj)) return

    this.inUse.delete(obj)
    this.reset(obj)

    if (this.available.length < this.maxSize) {
      this.available.push(obj)
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): { available: number; inUse: number; total: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
    }
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.available = []
    this.inUse.clear()
  }
}

/**
 * Type alias for mesh with single material
 */
type SingleMaterialMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material>

/**
 * Specialized pool for Three.js meshes
 */
export class MeshPool {
  private pools: Map<string, ObjectPool<SingleMaterialMesh>> = new Map()
  private geometries: Map<string, THREE.BufferGeometry> = new Map()
  private materials: Map<string, THREE.Material> = new Map()

  /**
   * Register a mesh type with its geometry and material
   */
  registerMeshType(
    key: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    initialSize: number = 10,
    maxSize: number = 100
  ): void {
    this.geometries.set(key, geometry)
    this.materials.set(key, material)

    const factory = (): SingleMaterialMesh => new THREE.Mesh(geometry, material.clone())
    const reset = (mesh: SingleMaterialMesh) => {
      mesh.position.set(0, 0, 0)
      mesh.rotation.set(0, 0, 0)
      mesh.scale.set(1, 1, 1)
      mesh.visible = false
      if (mesh.parent) {
        mesh.parent.remove(mesh)
      }
    }

    const pool = new ObjectPool<SingleMaterialMesh>(factory, reset, initialSize, maxSize)
    this.pools.set(key, pool)
  }

  /**
   * Acquire a mesh from the pool
   */
  acquire(key: string): SingleMaterialMesh | null {
    const pool = this.pools.get(key)
    if (!pool) {
      console.warn(`MeshPool: unknown mesh type "${key}"`)
      return null
    }
    return pool.acquire()
  }

  /**
   * Release a mesh back to the pool
   */
  release(key: string, mesh: SingleMaterialMesh): void {
    const pool = this.pools.get(key)
    if (pool) {
      pool.release(mesh)
    }
  }

  /**
   * Get statistics for all pools
   */
  getStats(): Record<string, { available: number; inUse: number; total: number }> {
    const stats: Record<string, { available: number; inUse: number; total: number }> = {}
    this.pools.forEach((pool, key) => {
      stats[key] = pool.getStats()
    })
    return stats
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.pools.forEach((pool) => pool.clear())
    this.pools.clear()

    this.geometries.forEach((geo) => geo.dispose())
    this.geometries.clear()

    this.materials.forEach((mat) => mat.dispose())
    this.materials.clear()
  }
}

/**
 * Memory manager for Three.js resources
 */
export class MemoryManager {
  private textures: Map<string, THREE.Texture> = new Map()
  private geometries: Map<string, THREE.BufferGeometry> = new Map()
  private materials: Map<string, THREE.Material> = new Map()
  private meshPool: MeshPool = new MeshPool()

  // Track usage for cleanup
  private lastAccess: Map<string, number> = new Map()
  private cleanupInterval: number = 30000 // 30 seconds
  private maxAge: number = 60000 // 60 seconds

  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.startCleanupTimer()
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupUnused()
    }, this.cleanupInterval)
  }

  /**
   * Register a texture
   */
  registerTexture(key: string, texture: THREE.Texture): void {
    this.textures.set(key, texture)
    this.lastAccess.set(`texture:${key}`, Date.now())
  }

  /**
   * Get a texture
   */
  getTexture(key: string): THREE.Texture | undefined {
    const texture = this.textures.get(key)
    if (texture) {
      this.lastAccess.set(`texture:${key}`, Date.now())
    }
    return texture
  }

  /**
   * Register a geometry
   */
  registerGeometry(key: string, geometry: THREE.BufferGeometry): void {
    this.geometries.set(key, geometry)
    this.lastAccess.set(`geometry:${key}`, Date.now())
  }

  /**
   * Get a geometry
   */
  getGeometry(key: string): THREE.BufferGeometry | undefined {
    const geometry = this.geometries.get(key)
    if (geometry) {
      this.lastAccess.set(`geometry:${key}`, Date.now())
    }
    return geometry
  }

  /**
   * Register a material
   */
  registerMaterial(key: string, material: THREE.Material): void {
    this.materials.set(key, material)
    this.lastAccess.set(`material:${key}`, Date.now())
  }

  /**
   * Get a material
   */
  getMaterial(key: string): THREE.Material | undefined {
    const material = this.materials.get(key)
    if (material) {
      this.lastAccess.set(`material:${key}`, Date.now())
    }
    return material
  }

  /**
   * Get mesh pool
   */
  getMeshPool(): MeshPool {
    return this.meshPool
  }

  /**
   * Cleanup unused resources
   */
  cleanupUnused(): void {
    const now = Date.now()
    const keysToRemove: string[] = []

    this.lastAccess.forEach((lastTime, key) => {
      if (now - lastTime > this.maxAge) {
        keysToRemove.push(key)
      }
    })

    keysToRemove.forEach((key) => {
      const [type, id] = key.split(':')

      switch (type) {
        case 'texture': {
          const texture = this.textures.get(id)
          if (texture) {
            texture.dispose()
            this.textures.delete(id)
          }
          break
        }
        case 'geometry': {
          const geometry = this.geometries.get(id)
          if (geometry) {
            geometry.dispose()
            this.geometries.delete(id)
          }
          break
        }
        case 'material': {
          const material = this.materials.get(id)
          if (material) {
            material.dispose()
            this.materials.delete(id)
          }
          break
        }
      }

      this.lastAccess.delete(key)
    })

    if (keysToRemove.length > 0) {
      // Resources cleaned up
    }
  }

  /**
   * Force dispose a specific resource
   */
  disposeResource(type: 'texture' | 'geometry' | 'material', key: string): void {
    switch (type) {
      case 'texture': {
        const texture = this.textures.get(key)
        if (texture) {
          texture.dispose()
          this.textures.delete(key)
          this.lastAccess.delete(`texture:${key}`)
        }
        break
      }
      case 'geometry': {
        const geometry = this.geometries.get(key)
        if (geometry) {
          geometry.dispose()
          this.geometries.delete(key)
          this.lastAccess.delete(`geometry:${key}`)
        }
        break
      }
      case 'material': {
        const material = this.materials.get(key)
        if (material) {
          material.dispose()
          this.materials.delete(key)
          this.lastAccess.delete(`material:${key}`)
        }
        break
      }
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    textures: number
    geometries: number
    materials: number
    meshPool: Record<string, { available: number; inUse: number; total: number }>
  } {
    return {
      textures: this.textures.size,
      geometries: this.geometries.size,
      materials: this.materials.size,
      meshPool: this.meshPool.getStats(),
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.textures.forEach((texture) => texture.dispose())
    this.textures.clear()

    this.geometries.forEach((geometry) => geometry.dispose())
    this.geometries.clear()

    this.materials.forEach((material) => material.dispose())
    this.materials.clear()

    this.meshPool.dispose()
    this.lastAccess.clear()
  }
}

/**
 * Singleton instance
 */
let memoryManagerInstance: MemoryManager | null = null

export function getMemoryManager(): MemoryManager {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager()
  }
  return memoryManagerInstance
}

export function disposeMemoryManager(): void {
  if (memoryManagerInstance) {
    memoryManagerInstance.dispose()
    memoryManagerInstance = null
  }
}

export default MemoryManager

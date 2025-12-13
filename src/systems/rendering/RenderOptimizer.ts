import * as THREE from 'three'
import type { Vector3D } from '@/types/neural'

/**
 * Render optimization configuration
 */
export interface RenderOptimizerConfig {
  enableFrustumCulling: boolean
  enableInstancing: boolean
  instanceThreshold: number // Minimum objects to use instancing
  maxInstanceCount: number
  cullMargin: number // Extra margin for frustum culling
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RenderOptimizerConfig = {
  enableFrustumCulling: true,
  enableInstancing: true,
  instanceThreshold: 10,
  maxInstanceCount: 1000,
  cullMargin: 5,
}

/**
 * Instance data for batch rendering
 */
interface InstanceData {
  position: Vector3D
  scale: number
  color: THREE.Color
  visible: boolean
}

/**
 * RenderOptimizer - Performance optimizations for the neural visualization
 * Implements frustum culling, instanced rendering, and render batching
 */
export class RenderOptimizer {
  private camera: THREE.Camera
  private config: RenderOptimizerConfig

  // Frustum for culling
  private frustum: THREE.Frustum = new THREE.Frustum()
  private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4()

  // Instanced meshes
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map()
  private instanceData: Map<string, Map<string, InstanceData>> = new Map()

  // Performance metrics
  private metrics = {
    totalObjects: 0,
    visibleObjects: 0,
    culledObjects: 0,
    instancedBatches: 0,
    lastUpdateTime: 0,
  }

  // Dummy for matrix calculations
  private dummyObject: THREE.Object3D = new THREE.Object3D()
  private colorAttribute: THREE.InstancedBufferAttribute | null = null

  constructor(camera: THREE.Camera, config?: Partial<RenderOptimizerConfig>) {
    this.camera = camera
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Update frustum from camera
   */
  updateFrustum(): void {
    this.projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    )
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix)
  }

  /**
   * Check if a point is visible in the frustum
   */
  isPointVisible(position: Vector3D, radius: number = 1): boolean {
    if (!this.config.enableFrustumCulling) return true

    const sphere = new THREE.Sphere(
      new THREE.Vector3(position.x, position.y, position.z),
      radius + this.config.cullMargin
    )
    return this.frustum.intersectsSphere(sphere)
  }

  /**
   * Check if a bounding box is visible
   */
  isBoxVisible(box: THREE.Box3): boolean {
    if (!this.config.enableFrustumCulling) return true
    return this.frustum.intersectsBox(box)
  }

  /**
   * Cull objects based on frustum visibility
   * Returns array of visible object IDs
   */
  cullObjects(objects: Map<string, { position: Vector3D; radius?: number }>): Set<string> {
    this.updateFrustum()

    const visible = new Set<string>()
    let culled = 0

    objects.forEach((obj, id) => {
      if (this.isPointVisible(obj.position, obj.radius || 1)) {
        visible.add(id)
      } else {
        culled++
      }
    })

    this.metrics.totalObjects = objects.size
    this.metrics.visibleObjects = visible.size
    this.metrics.culledObjects = culled

    return visible
  }

  /**
   * Create an instanced mesh for batch rendering
   */
  createInstancedMesh(
    key: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    scene: THREE.Scene
  ): THREE.InstancedMesh {
    // Remove existing if present
    this.disposeInstancedMesh(key)

    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      this.config.maxInstanceCount
    )
    mesh.name = `instanced-${key}`
    mesh.count = 0
    mesh.frustumCulled = false // We handle culling ourselves

    // Add color attribute for per-instance colors
    const colors = new Float32Array(this.config.maxInstanceCount * 3)
    this.colorAttribute = new THREE.InstancedBufferAttribute(colors, 3)
    mesh.instanceColor = this.colorAttribute

    scene.add(mesh)
    this.instancedMeshes.set(key, mesh)
    this.instanceData.set(key, new Map())

    return mesh
  }

  /**
   * Register an instance
   */
  registerInstance(
    meshKey: string,
    instanceId: string,
    position: Vector3D,
    scale: number = 1,
    color: THREE.Color = new THREE.Color(0x8b5cf6)
  ): void {
    const data = this.instanceData.get(meshKey)
    if (!data) return

    data.set(instanceId, {
      position,
      scale,
      color,
      visible: true,
    })
  }

  /**
   * Update instance data
   */
  updateInstance(
    meshKey: string,
    instanceId: string,
    updates: Partial<InstanceData>
  ): void {
    const data = this.instanceData.get(meshKey)
    if (!data) return

    const instance = data.get(instanceId)
    if (instance) {
      Object.assign(instance, updates)
    }
  }

  /**
   * Remove an instance
   */
  removeInstance(meshKey: string, instanceId: string): void {
    const data = this.instanceData.get(meshKey)
    if (data) {
      data.delete(instanceId)
    }
  }

  /**
   * Update all instanced meshes
   * Call this once per frame after all instance updates
   */
  updateInstancedMeshes(): void {
    this.updateFrustum()

    this.instancedMeshes.forEach((mesh, key) => {
      const data = this.instanceData.get(key)
      if (!data) return

      let index = 0

      data.forEach((instance) => {
        // Skip if not visible or culled
        if (!instance.visible) return
        if (!this.isPointVisible(instance.position, instance.scale)) return

        // Update transform
        this.dummyObject.position.set(
          instance.position.x,
          instance.position.y,
          instance.position.z
        )
        this.dummyObject.scale.setScalar(instance.scale)
        this.dummyObject.updateMatrix()

        mesh.setMatrixAt(index, this.dummyObject.matrix)

        // Update color
        if (mesh.instanceColor) {
          mesh.instanceColor.setXYZ(
            index,
            instance.color.r,
            instance.color.g,
            instance.color.b
          )
        }

        index++
      })

      // Update count and flag for GPU update
      mesh.count = index
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true
      }
    })

    this.metrics.instancedBatches = this.instancedMeshes.size
    this.metrics.lastUpdateTime = Date.now()
  }

  /**
   * Get or create instanced mesh with auto-setup
   */
  getOrCreateInstancedMesh(
    key: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    scene: THREE.Scene
  ): THREE.InstancedMesh {
    let mesh = this.instancedMeshes.get(key)
    if (!mesh) {
      mesh = this.createInstancedMesh(key, geometry, material, scene)
    }
    return mesh
  }

  /**
   * Dispose an instanced mesh
   */
  disposeInstancedMesh(key: string): void {
    const mesh = this.instancedMeshes.get(key)
    if (mesh) {
      if (mesh.parent) {
        mesh.parent.remove(mesh)
      }
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
      this.instancedMeshes.delete(key)
      this.instanceData.delete(key)
    }
  }

  /**
   * Apply visibility to a group of objects based on frustum culling
   */
  applyFrustumCulling(objects: THREE.Object3D[]): void {
    this.updateFrustum()

    objects.forEach((obj) => {
      if (!obj.userData.boundingSphere) {
        // Compute bounding sphere if not cached
        if (obj instanceof THREE.Mesh && obj.geometry) {
          obj.geometry.computeBoundingSphere()
          obj.userData.boundingSphere = obj.geometry.boundingSphere
        }
      }

      const sphere = obj.userData.boundingSphere as THREE.Sphere | undefined
      if (sphere) {
        const worldSphere = sphere.clone()
        worldSphere.applyMatrix4(obj.matrixWorld)
        obj.visible = this.frustum.intersectsSphere(worldSphere)
      }
    })
  }

  /**
   * Optimize a scene by applying culling and batching
   */
  optimizeScene(scene: THREE.Scene): void {
    const meshes: THREE.Mesh[] = []

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshes.push(obj)
      }
    })

    this.applyFrustumCulling(meshes)
  }

  /**
   * Get performance metrics
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics }
  }

  /**
   * Get configuration
   */
  getConfig(): RenderOptimizerConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<RenderOptimizerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Check if instancing should be used
   */
  shouldUseInstancing(objectCount: number): boolean {
    return (
      this.config.enableInstancing &&
      objectCount >= this.config.instanceThreshold
    )
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.instancedMeshes.forEach((_, key) => {
      this.disposeInstancedMesh(key)
    })
    this.instancedMeshes.clear()
    this.instanceData.clear()
  }
}

export default RenderOptimizer

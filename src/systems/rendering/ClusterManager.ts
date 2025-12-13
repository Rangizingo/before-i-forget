import * as THREE from 'three'
import type { Vector3D } from '@/types/neural'

/**
 * Cluster configuration
 */
export interface ClusterConfig {
  minDistance: number // Minimum distance from camera to start clustering
  clusterRadius: number // Radius within which neurons are grouped
  minNeuronsToCluster: number // Minimum neurons to form a cluster
  maxClusters: number // Maximum number of clusters to display
}

/**
 * Cluster data
 */
export interface Cluster {
  id: string
  center: Vector3D
  neuronIds: string[]
  count: number
  boundingRadius: number
}

/**
 * Default cluster configuration
 */
const DEFAULT_CONFIG: ClusterConfig = {
  minDistance: 80,
  clusterRadius: 15,
  minNeuronsToCluster: 3,
  maxClusters: 50,
}

/**
 * ClusterManager - Groups distant neurons into clusters for performance
 * When camera is far away, individual neurons are replaced with cluster badges
 */
export class ClusterManager {
  private camera: THREE.Camera
  private config: ClusterConfig
  private clusters: Map<string, Cluster> = new Map()
  private neuronPositions: Map<string, Vector3D> = new Map()

  // Cluster meshes
  private clusterGroup: THREE.Group
  private clusterMeshes: Map<string, THREE.Mesh> = new Map()

  // Materials
  private clusterMaterial: THREE.MeshBasicMaterial
  private badgeGeometry: THREE.CircleGeometry

  // Update throttling
  private lastUpdateTime = 0
  private updateInterval = 200 // ms between cluster recalculations

  // Clustering state
  private isClusteringActive = false

  constructor(camera: THREE.Camera, scene: THREE.Scene, config?: Partial<ClusterConfig>) {
    this.camera = camera
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Create cluster group
    this.clusterGroup = new THREE.Group()
    this.clusterGroup.name = 'clusters'
    scene.add(this.clusterGroup)

    // Create shared materials
    this.clusterMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    })

    // Badge geometry (circle)
    this.badgeGeometry = new THREE.CircleGeometry(2, 16)
  }

  /**
   * Register a neuron position for clustering
   */
  registerNeuron(id: string, position: Vector3D): void {
    this.neuronPositions.set(id, { ...position })
  }

  /**
   * Unregister a neuron
   */
  unregisterNeuron(id: string): void {
    this.neuronPositions.delete(id)
  }

  /**
   * Update neuron position
   */
  updateNeuronPosition(id: string, position: Vector3D): void {
    if (this.neuronPositions.has(id)) {
      this.neuronPositions.set(id, { ...position })
    }
  }

  /**
   * Check if clustering should be active based on camera distance
   */
  private shouldCluster(): boolean {
    // Calculate average distance to neurons
    if (this.neuronPositions.size === 0) return false

    const cameraPos = this.camera.position
    let totalDistance = 0
    let count = 0

    this.neuronPositions.forEach((pos) => {
      const dx = pos.x - cameraPos.x
      const dy = pos.y - cameraPos.y
      const dz = pos.z - cameraPos.z
      totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz)
      count++
    })

    const avgDistance = totalDistance / count
    return avgDistance >= this.config.minDistance
  }

  /**
   * Calculate distance between two positions
   */
  private getDistance(a: Vector3D, b: Vector3D): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = a.z - b.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * Build clusters using simple spatial hashing
   */
  private buildClusters(): Cluster[] {
    const positions = Array.from(this.neuronPositions.entries())
    const clustered = new Set<string>()
    const clusters: Cluster[] = []

    // Sort by distance from camera for consistent clustering
    const cameraPos = this.camera.position
    positions.sort((a, b) => {
      const distA = this.getDistance(a[1], { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z })
      const distB = this.getDistance(b[1], { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z })
      return distA - distB
    })

    for (const [id, pos] of positions) {
      if (clustered.has(id)) continue

      // Check distance from camera
      const distFromCamera = this.getDistance(pos, { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z })
      if (distFromCamera < this.config.minDistance) continue

      // Find nearby neurons
      const nearby: string[] = [id]
      let centerX = pos.x
      let centerY = pos.y
      let centerZ = pos.z
      let maxRadius = 0

      for (const [otherId, otherPos] of positions) {
        if (otherId === id || clustered.has(otherId)) continue

        const dist = this.getDistance(pos, otherPos)
        if (dist <= this.config.clusterRadius) {
          nearby.push(otherId)
          centerX += otherPos.x
          centerY += otherPos.y
          centerZ += otherPos.z
          maxRadius = Math.max(maxRadius, dist)
        }
      }

      // Create cluster if enough neurons
      if (nearby.length >= this.config.minNeuronsToCluster) {
        nearby.forEach((nid) => clustered.add(nid))

        const center: Vector3D = {
          x: centerX / nearby.length,
          y: centerY / nearby.length,
          z: centerZ / nearby.length,
        }

        clusters.push({
          id: `cluster-${clusters.length}`,
          center,
          neuronIds: nearby,
          count: nearby.length,
          boundingRadius: maxRadius || this.config.clusterRadius,
        })

        if (clusters.length >= this.config.maxClusters) break
      }
    }

    return clusters
  }

  /**
   * Create or update cluster mesh
   */
  private updateClusterMesh(cluster: Cluster): THREE.Mesh {
    let mesh = this.clusterMeshes.get(cluster.id)

    if (!mesh) {
      mesh = new THREE.Mesh(this.badgeGeometry, this.clusterMaterial.clone())
      mesh.name = cluster.id
      this.clusterGroup.add(mesh)
      this.clusterMeshes.set(cluster.id, mesh)
    }

    // Position cluster badge
    mesh.position.set(cluster.center.x, cluster.center.y, cluster.center.z)

    // Scale based on count
    const scale = 1 + Math.log10(cluster.count) * 0.5
    mesh.scale.set(scale, scale, scale)

    // Face camera (billboard)
    mesh.lookAt(this.camera.position)

    // Update opacity based on count
    const material = mesh.material as THREE.MeshBasicMaterial
    material.opacity = Math.min(0.4 + cluster.count * 0.05, 0.9)

    return mesh
  }

  /**
   * Remove unused cluster meshes
   */
  private cleanupMeshes(activeIds: Set<string>): void {
    const toRemove: string[] = []

    this.clusterMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.clusterGroup.remove(mesh)
        mesh.geometry.dispose()
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose()
        }
        toRemove.push(id)
      }
    })

    toRemove.forEach((id) => this.clusterMeshes.delete(id))
  }

  /**
   * Update clusters based on current camera position
   * Returns set of neuron IDs that are clustered (should be hidden)
   */
  update(): Set<string> {
    const now = Date.now()
    const clusteredNeurons = new Set<string>()

    // Throttle updates
    if (now - this.lastUpdateTime < this.updateInterval) {
      // Return current clustered neurons
      this.clusters.forEach((cluster) => {
        cluster.neuronIds.forEach((id) => clusteredNeurons.add(id))
      })
      return clusteredNeurons
    }
    this.lastUpdateTime = now

    // Check if clustering should be active
    const shouldCluster = this.shouldCluster()

    if (!shouldCluster) {
      // Disable clustering
      if (this.isClusteringActive) {
        this.cleanupMeshes(new Set())
        this.clusters.clear()
        this.isClusteringActive = false
      }
      return clusteredNeurons
    }

    this.isClusteringActive = true

    // Build new clusters
    const newClusters = this.buildClusters()

    // Update cluster map
    this.clusters.clear()
    const activeIds = new Set<string>()

    newClusters.forEach((cluster) => {
      this.clusters.set(cluster.id, cluster)
      activeIds.add(cluster.id)
      this.updateClusterMesh(cluster)
      cluster.neuronIds.forEach((id) => clusteredNeurons.add(id))
    })

    // Cleanup unused meshes
    this.cleanupMeshes(activeIds)

    // Update billboard orientation for all clusters
    this.clusterMeshes.forEach((mesh) => {
      mesh.lookAt(this.camera.position)
    })

    return clusteredNeurons
  }

  /**
   * Get cluster containing a neuron
   */
  getClusterForNeuron(neuronId: string): Cluster | null {
    for (const cluster of this.clusters.values()) {
      if (cluster.neuronIds.includes(neuronId)) {
        return cluster
      }
    }
    return null
  }

  /**
   * Check if a neuron is currently clustered
   */
  isNeuronClustered(neuronId: string): boolean {
    return this.getClusterForNeuron(neuronId) !== null
  }

  /**
   * Get all current clusters
   */
  getClusters(): Cluster[] {
    return Array.from(this.clusters.values())
  }

  /**
   * Get cluster count
   */
  getClusterCount(): number {
    return this.clusters.size
  }

  /**
   * Get total clustered neuron count
   */
  getClusteredNeuronCount(): number {
    let count = 0
    this.clusters.forEach((cluster) => {
      count += cluster.count
    })
    return count
  }

  /**
   * Check if clustering is currently active
   */
  isActive(): boolean {
    return this.isClusteringActive
  }

  /**
   * Set cluster visibility
   */
  setVisible(visible: boolean): void {
    this.clusterGroup.visible = visible
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<ClusterConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Force cluster recalculation
   */
  forceUpdate(): Set<string> {
    this.lastUpdateTime = 0
    return this.update()
  }

  /**
   * Get statistics
   */
  getStats(): {
    isActive: boolean
    clusterCount: number
    clusteredNeurons: number
    totalNeurons: number
  } {
    return {
      isActive: this.isClusteringActive,
      clusterCount: this.clusters.size,
      clusteredNeurons: this.getClusteredNeuronCount(),
      totalNeurons: this.neuronPositions.size,
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Remove all meshes
    this.clusterMeshes.forEach((mesh) => {
      this.clusterGroup.remove(mesh)
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    })
    this.clusterMeshes.clear()

    // Dispose shared resources
    this.badgeGeometry.dispose()
    this.clusterMaterial.dispose()

    // Remove group from scene
    if (this.clusterGroup.parent) {
      this.clusterGroup.parent.remove(this.clusterGroup)
    }

    this.clusters.clear()
    this.neuronPositions.clear()
  }
}

export default ClusterManager

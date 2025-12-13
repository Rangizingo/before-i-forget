import type { Vector3D, NeuronData, ClusterData } from '@/types/neural'

/**
 * ClusterManager - Groups neurons into clusters based on proximity or tags
 * Used for visual organization and layer management
 */
export class ClusterManager {
  private static readonly CLUSTER_RADIUS = 15
  private static readonly MIN_CLUSTER_SIZE = 3

  /**
   * Identify clusters in the network using proximity-based clustering
   */
  static identifyClusters(neurons: NeuronData[]): ClusterData[] {
    if (neurons.length === 0) return []

    // Use DBSCAN-like algorithm for clustering
    const visited = new Set<string>()
    const clusters: ClusterData[] = []
    let clusterId = 0

    neurons.forEach((neuron) => {
      if (visited.has(neuron.id)) return

      // Start new cluster
      const clusterNeurons = this.expandCluster(neuron, neurons, visited)

      if (clusterNeurons.length >= this.MIN_CLUSTER_SIZE) {
        const cluster: ClusterData = {
          id: `cluster_${clusterId++}`,
          centroid: this.calculateCentroid(
            clusterNeurons.map((id) => neurons.find((n) => n.id === id)!.position)
          ),
          neurons: clusterNeurons,
          createdAt: Date.now(),
        }
        clusters.push(cluster)
      }
    })

    return clusters
  }

  /**
   * Expand cluster using density-based approach
   */
  private static expandCluster(
    startNeuron: NeuronData,
    allNeurons: NeuronData[],
    visited: Set<string>
  ): string[] {
    const cluster: string[] = []
    const queue: NeuronData[] = [startNeuron]

    while (queue.length > 0) {
      const neuron = queue.shift()!
      if (visited.has(neuron.id)) continue

      visited.add(neuron.id)
      cluster.push(neuron.id)

      // Find neighbors within cluster radius
      const neighbors = allNeurons.filter((n) => {
        if (n.id === neuron.id) return false
        if (visited.has(n.id)) return false
        const dist = this.distance(neuron.position, n.position)
        return dist <= this.CLUSTER_RADIUS
      })

      queue.push(...neighbors)
    }

    return cluster
  }

  /**
   * Identify clusters based on task tags/themes
   */
  static identifyTagBasedClusters(
    neurons: NeuronData[],
    getTaskTag: (taskId: string) => string | undefined
  ): ClusterData[] {
    const tagMap = new Map<string, NeuronData[]>()

    // Group neurons by tag
    neurons.forEach((neuron) => {
      if (!neuron.taskId) return

      const tag = getTaskTag(neuron.taskId)
      if (!tag) return

      if (!tagMap.has(tag)) {
        tagMap.set(tag, [])
      }
      tagMap.get(tag)!.push(neuron)
    })

    // Create clusters from tag groups
    const clusters: ClusterData[] = []
    let clusterId = 0

    tagMap.forEach((neurons, tag) => {
      if (neurons.length < this.MIN_CLUSTER_SIZE) return

      const cluster: ClusterData = {
        id: `cluster_${tag}_${clusterId++}`,
        centroid: this.calculateCentroid(neurons.map((n) => n.position)),
        neurons: neurons.map((n) => n.id),
        theme: tag,
        createdAt: Date.now(),
      }
      clusters.push(cluster)
    })

    return clusters
  }

  /**
   * Hybrid clustering: proximity + tag affinity
   */
  static identifyHybridClusters(
    neurons: NeuronData[],
    getTaskTag: (taskId: string) => string | undefined
  ): ClusterData[] {
    if (neurons.length === 0) return []

    const visited = new Set<string>()
    const clusters: ClusterData[] = []
    let clusterId = 0

    neurons.forEach((neuron) => {
      if (visited.has(neuron.id)) return

      const tag = neuron.taskId ? getTaskTag(neuron.taskId) : undefined
      const clusterNeurons = this.expandHybridCluster(neuron, neurons, visited, getTaskTag)

      if (clusterNeurons.length >= this.MIN_CLUSTER_SIZE) {
        const cluster: ClusterData = {
          id: `cluster_${clusterId++}`,
          centroid: this.calculateCentroid(
            clusterNeurons.map((id) => neurons.find((n) => n.id === id)!.position)
          ),
          neurons: clusterNeurons,
          theme: tag,
          createdAt: Date.now(),
        }
        clusters.push(cluster)
      }
    })

    return clusters
  }

  /**
   * Expand cluster with tag affinity
   */
  private static expandHybridCluster(
    startNeuron: NeuronData,
    allNeurons: NeuronData[],
    visited: Set<string>,
    getTaskTag: (taskId: string) => string | undefined
  ): string[] {
    const cluster: string[] = []
    const queue: NeuronData[] = [startNeuron]
    const startTag = startNeuron.taskId ? getTaskTag(startNeuron.taskId) : undefined

    while (queue.length > 0) {
      const neuron = queue.shift()!
      if (visited.has(neuron.id)) continue

      visited.add(neuron.id)
      cluster.push(neuron.id)

      // Find neighbors within cluster radius
      const neighbors = allNeurons.filter((n) => {
        if (n.id === neuron.id) return false
        if (visited.has(n.id)) return false

        const dist = this.distance(neuron.position, n.position)
        if (dist > this.CLUSTER_RADIUS) return false

        // Prefer same tag
        const nTag = n.taskId ? getTaskTag(n.taskId) : undefined
        if (startTag && nTag && startTag !== nTag) {
          // Different tags need to be closer
          return dist <= this.CLUSTER_RADIUS * 0.5
        }

        return true
      })

      queue.push(...neighbors)
    }

    return cluster
  }

  /**
   * Get cluster centroid (average position)
   */
  static getClusterCentroid(cluster: ClusterData): Vector3D {
    return cluster.centroid
  }

  /**
   * Calculate centroid from positions
   */
  private static calculateCentroid(positions: Vector3D[]): Vector3D {
    if (positions.length === 0) return { x: 0, y: 0, z: 0 }

    const sum = positions.reduce(
      (acc, pos) => ({
        x: acc.x + pos.x,
        y: acc.y + pos.y,
        z: acc.z + pos.z,
      }),
      { x: 0, y: 0, z: 0 }
    )

    return {
      x: sum.x / positions.length,
      y: sum.y / positions.length,
      z: sum.z / positions.length,
    }
  }

  /**
   * Assign a neuron to the nearest cluster
   */
  static assignToCluster(neuron: NeuronData, clusters: ClusterData[]): string | undefined {
    if (clusters.length === 0) return undefined

    let nearestClusterId: string | undefined = undefined
    let minDistance = Infinity

    clusters.forEach((cluster) => {
      const dist = this.distance(neuron.position, cluster.centroid)
      if (dist < minDistance) {
        minDistance = dist
        nearestClusterId = cluster.id
      }
    })

    // Only assign if within reasonable distance
    if (nearestClusterId && minDistance <= this.CLUSTER_RADIUS * 1.5) {
      return nearestClusterId
    }

    return undefined
  }

  /**
   * Update cluster centroids based on current neuron positions
   */
  static updateClusterCentroids(
    clusters: ClusterData[],
    neurons: Map<string, NeuronData>
  ): void {
    clusters.forEach((cluster) => {
      const positions = cluster.neurons
        .map((id) => neurons.get(id)?.position)
        .filter((pos) => pos !== undefined) as Vector3D[]

      if (positions.length > 0) {
        cluster.centroid = this.calculateCentroid(positions)
      }
    })
  }

  /**
   * Remove empty clusters
   */
  static pruneEmptyClusters(clusters: ClusterData[]): ClusterData[] {
    return clusters.filter((cluster) => cluster.neurons.length >= this.MIN_CLUSTER_SIZE)
  }

  /**
   * Merge overlapping clusters
   */
  static mergeClusters(clusters: ClusterData[], mergeDistance = 10): ClusterData[] {
    if (clusters.length <= 1) return clusters

    const merged: ClusterData[] = []
    const processed = new Set<string>()

    clusters.forEach((cluster) => {
      if (processed.has(cluster.id)) return

      const group = [cluster]
      processed.add(cluster.id)

      // Find overlapping clusters
      clusters.forEach((other) => {
        if (processed.has(other.id)) return

        const dist = this.distance(cluster.centroid, other.centroid)
        if (dist <= mergeDistance) {
          group.push(other)
          processed.add(other.id)
        }
      })

      // Merge group into single cluster
      if (group.length === 1) {
        merged.push(cluster)
      } else {
        const allNeurons = group.flatMap((c) => c.neurons)
        const allPositions = group.map((c) => c.centroid)
        const theme = group.find((c) => c.theme)?.theme

        merged.push({
          id: `merged_${cluster.id}`,
          centroid: this.calculateCentroid(allPositions),
          neurons: allNeurons,
          theme,
          createdAt: Math.min(...group.map((c) => c.createdAt)),
        })
      }
    })

    return merged
  }

  /**
   * Get cluster statistics
   */
  static getClusterStats(cluster: ClusterData, neurons: Map<string, NeuronData>) {
    const clusterNeurons = cluster.neurons
      .map((id) => neurons.get(id))
      .filter((n) => n !== undefined) as NeuronData[]

    const states = {
      active: clusterNeurons.filter((n) => n.state === 'active').length,
      completed: clusterNeurons.filter((n) => n.state === 'completed').length,
      dormant: clusterNeurons.filter((n) => n.state === 'dormant').length,
    }

    const avgEnergy =
      clusterNeurons.reduce((sum, n) => sum + n.energy, 0) / clusterNeurons.length

    return {
      totalNeurons: clusterNeurons.length,
      states,
      avgEnergy,
      theme: cluster.theme,
    }
  }

  /**
   * Calculate distance between two points
   */
  private static distance(a: Vector3D, b: Vector3D): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = a.z - b.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
}

export default ClusterManager

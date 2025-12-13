import type { Vector3D, NeuronData, ConnectionData, NetworkState } from '@/types/neural'
import { Neuron } from './Neuron'
import { Connection } from './Connection'
import { SpatialHash } from './SpatialHash'

/**
 * SeededRandom - Simple seeded random number generator
 */
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)]
  }
}

/**
 * NetworkGenerator - Procedural generation of neural networks
 * Uses force-directed layout and deterministic seeding
 */
export class NetworkGenerator {
  private static readonly MIN_DISTANCE = 5
  private static readonly MAX_CONNECTIONS_PER_NEURON = 6
  private static readonly MIN_CONNECTIONS = 2
  private static readonly MAX_CONNECTIONS = 4
  private static readonly CONNECTION_SEARCH_RADIUS = 20
  private static readonly EDGE_SPAWN_RADIUS = 15

  /**
   * Generate initial network from seed
   */
  static generateNetwork(seed: number, existingNeurons: NeuronData[] = []): NetworkState {
    const rng = new SeededRandom(seed)
    const neurons = new Map<string, NeuronData>()
    const connections = new Map<string, ConnectionData>()
    const clusters = new Map()

    // Add existing neurons
    existingNeurons.forEach((neuron) => {
      neurons.set(neuron.id, neuron)
    })

    // Generate initial neurons if starting fresh
    if (existingNeurons.length === 0) {
      const initialCount = 5

      for (let i = 0; i < initialCount; i++) {
        const angle = (i / initialCount) * Math.PI * 2
        const radius = 10
        const position: Vector3D = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: rng.range(-2, 2),
        }

        const neuron = new Neuron(`neuron_${i}`, position, null, 'dormant')
        neurons.set(neuron.id, neuron.toData())
      }

      // Create connections between initial neurons
      const neuronArray = Array.from(neurons.values())
      neuronArray.forEach((neuron, i) => {
        const nextNeuron = neuronArray[(i + 1) % neuronArray.length]
        const connId = Connection.generateId(neuron.id, nextNeuron.id)
        const conn = new Connection(connId, neuron.id, nextNeuron.id, 0.5, 'active')
        connections.set(connId, conn.toData())

        // Update neuron connections
        neuron.connections.push(nextNeuron.id)
        nextNeuron.connections.push(neuron.id)
      })
    }

    return {
      neurons,
      connections,
      clusters,
      seed,
      lastUpdateAt: Date.now(),
    }
  }

  /**
   * Add a new neuron to the network
   */
  static addNeuron(
    network: NetworkState,
    taskId: string | null = null,
    state: 'active' | 'completed' | 'dormant' = 'active'
  ): NeuronData {
    // Calculate optimal position
    const position = this.calculateOptimalPosition(network)

    // Create new neuron
    const id = `neuron_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const neuron = new Neuron(id, position, taskId, state)
    const neuronData = neuron.toData()

    // Add to network
    network.neurons.set(id, neuronData)

    // Create connections
    const newConnections = this.createConnections(neuronData, network)
    newConnections.forEach((conn) => {
      network.connections.set(conn.id, conn)

      // Update both neurons' connection lists
      const source = network.neurons.get(conn.sourceId)
      const target = network.neurons.get(conn.targetId)
      if (source && !source.connections.includes(conn.targetId)) {
        source.connections.push(conn.targetId)
      }
      if (target && !target.connections.includes(conn.sourceId)) {
        target.connections.push(conn.sourceId)
      }
    })

    network.lastUpdateAt = Date.now()

    return neuronData
  }

  /**
   * Calculate optimal position for a new neuron
   */
  static calculateOptimalPosition(network: NetworkState): Vector3D {
    const spatialHash = new SpatialHash(this.MIN_DISTANCE)
    const neurons = Array.from(network.neurons.values())

    // Build spatial hash
    neurons.forEach((neuron) => {
      spatialHash.insert(neuron.id, neuron.position)
    })

    // If no neurons, start at origin
    if (neurons.length === 0) {
      return { x: 0, y: 0, z: 0 }
    }

    // Calculate network centroid
    const centroid = this.calculateCentroid(neurons)

    // Calculate average radius
    const avgRadius = this.calculateAverageRadius(neurons, centroid)
    const spawnRadius = Math.max(avgRadius, this.EDGE_SPAWN_RADIUS)

    // Try multiple random positions on the edge
    let bestPosition: Vector3D | null = null
    let bestScore = -Infinity
    const attempts = 20

    for (let i = 0; i < attempts; i++) {
      // Random position on sphere surface
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const position: Vector3D = {
        x: centroid.x + spawnRadius * Math.sin(phi) * Math.cos(theta),
        y: centroid.y + spawnRadius * Math.sin(phi) * Math.sin(theta),
        z: centroid.z + spawnRadius * Math.cos(phi),
      }

      // Score this position
      const score = this.scorePosition(position, spatialHash)
      if (score > bestScore) {
        bestScore = score
        bestPosition = position
      }
    }

    return bestPosition || { x: spawnRadius, y: 0, z: 0 }
  }

  /**
   * Score a position based on distance to other neurons
   */
  private static scorePosition(position: Vector3D, spatialHash: SpatialHash): number {
    const nearby = spatialHash.query(position, this.CONNECTION_SEARCH_RADIUS)
    if (nearby.length === 0) return -100 // Too isolated

    let score = 0

    // Prefer positions with some nearby neurons but not too crowded
    const nearbyCount = nearby.length
    if (nearbyCount >= 2 && nearbyCount <= 5) {
      score += 50
    }

    // Check minimum distance constraint
    const hasCollision = spatialHash.hasCollision(position, this.MIN_DISTANCE)
    if (hasCollision) {
      return -Infinity
    }

    // Calculate average distance to nearby neurons
    let totalDist = 0
    nearby.forEach((id) => {
      const neuronPos = spatialHash.getPosition(id)
      if (neuronPos) {
        const dist = this.distance(position, neuronPos)
        totalDist += dist
      }
    })
    const avgDist = totalDist / nearby.length

    // Prefer medium distances (not too close, not too far)
    const idealDist = 10
    score -= Math.abs(avgDist - idealDist)

    return score
  }

  /**
   * Create connections for a new neuron
   */
  static createConnections(neuron: NeuronData, network: NetworkState): ConnectionData[] {
    const connections: ConnectionData[] = []
    const spatialHash = new SpatialHash(this.MIN_DISTANCE)

    // Build spatial hash
    Array.from(network.neurons.values()).forEach((n) => {
      if (n.id !== neuron.id) {
        spatialHash.insert(n.id, n.position)
      }
    })

    // Find nearby neurons
    const nearby = spatialHash.query(neuron.position, this.CONNECTION_SEARCH_RADIUS)

    // Sort by distance
    const candidates = nearby
      .map((id) => {
        const n = network.neurons.get(id)
        if (!n) return null
        return {
          neuron: n,
          distance: this.distance(neuron.position, n.position),
        }
      })
      .filter((c) => c !== null)
      .sort((a, b) => a!.distance - b!.distance) as Array<{
      neuron: NeuronData
      distance: number
    }>

    // Connect to nearby neurons (prefer those with fewer connections)
    const numConnections = Math.min(
      Math.max(this.MIN_CONNECTIONS, Math.floor(Math.random() * this.MAX_CONNECTIONS) + 1),
      candidates.length
    )

    for (let i = 0; i < numConnections && i < candidates.length; i++) {
      const target = candidates[i].neuron

      // Check if target already has too many connections
      if (target.connections.length >= this.MAX_CONNECTIONS_PER_NEURON) continue

      // Don't create duplicate connections
      if (target.connections.includes(neuron.id)) continue

      const connId = Connection.generateId(neuron.id, target.id)
      const conn = new Connection(connId, neuron.id, target.id, 0.3, 'forming')
      connections.push(conn.toData())
    }

    return connections
  }

  /**
   * Apply force-directed layout to network
   */
  static applyForceDirectedLayout(
    neurons: Neuron[],
    connections: Connection[],
    delta: number,
    iterations = 1
  ): void {
    const repulsionStrength = 100
    const attractionStrength = 0.1
    const centeringStrength = 0.01
    const damping = 0.8

    for (let iter = 0; iter < iterations; iter++) {
      // Reset forces
      neurons.forEach((neuron) => {
        neuron.applyForce({ x: 0, y: 0, z: 0 })
      })

      // Repulsion force (all neurons repel each other)
      for (let i = 0; i < neurons.length; i++) {
        for (let j = i + 1; j < neurons.length; j++) {
          const n1 = neurons[i]
          const n2 = neurons[j]

          const dx = n2.position.x - n1.position.x
          const dy = n2.position.y - n1.position.y
          const dz = n2.position.z - n1.position.z
          const distSq = dx * dx + dy * dy + dz * dz + 0.1 // Avoid division by zero

          const force = repulsionStrength / distSq
          const dist = Math.sqrt(distSq)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          const fz = (dz / dist) * force

          n1.applyForce({ x: -fx, y: -fy, z: -fz })
          n2.applyForce({ x: fx, y: fy, z: fz })
        }
      }

      // Attraction force (connected neurons attract)
      const neuronMap = new Map(neurons.map((n) => [n.id, n]))
      connections.forEach((conn) => {
        const source = neuronMap.get(conn.sourceId)
        const target = neuronMap.get(conn.targetId)
        if (!source || !target) return

        const dx = target.position.x - source.position.x
        const dy = target.position.y - source.position.y
        const dz = target.position.z - source.position.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        const force = dist * attractionStrength
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        const fz = (dz / dist) * force

        source.applyForce({ x: fx, y: fy, z: fz })
        target.applyForce({ x: -fx, y: -fy, z: -fz })
      })

      // Centering force (gentle pull toward origin)
      neurons.forEach((neuron) => {
        const fx = -neuron.position.x * centeringStrength
        const fy = -neuron.position.y * centeringStrength
        const fz = -neuron.position.z * centeringStrength
        neuron.applyForce({ x: fx, y: fy, z: fz })
      })

      // Update positions
      neurons.forEach((neuron) => {
        neuron.update(delta, damping)
      })
    }
  }

  /**
   * Calculate centroid of neurons
   */
  private static calculateCentroid(neurons: NeuronData[]): Vector3D {
    if (neurons.length === 0) return { x: 0, y: 0, z: 0 }

    const sum = neurons.reduce(
      (acc, n) => ({
        x: acc.x + n.position.x,
        y: acc.y + n.position.y,
        z: acc.z + n.position.z,
      }),
      { x: 0, y: 0, z: 0 }
    )

    return {
      x: sum.x / neurons.length,
      y: sum.y / neurons.length,
      z: sum.z / neurons.length,
    }
  }

  /**
   * Calculate average radius from centroid
   */
  private static calculateAverageRadius(neurons: NeuronData[], centroid: Vector3D): number {
    if (neurons.length === 0) return 0

    const totalRadius = neurons.reduce((acc, n) => {
      return acc + this.distance(n.position, centroid)
    }, 0)

    return totalRadius / neurons.length
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

export default NetworkGenerator

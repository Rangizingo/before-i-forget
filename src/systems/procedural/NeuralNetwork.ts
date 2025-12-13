import type {
  NetworkState,
  NeuronData,
  ConnectionData,
  ClusterData,
  NetworkPersistence,
  PersistedNeuronData,
} from '@/types/neural'
import { Neuron } from './Neuron'
import { Connection } from './Connection'
import { NetworkGenerator } from './NetworkGenerator'
import { ClusterManager } from './ClusterManager'
import { SpatialHash } from './SpatialHash'

/**
 * NeuralNetwork - Main orchestration class for the neural network system
 * Manages neurons, connections, clusters, and simulation updates
 */
export class NeuralNetwork {
  private state: NetworkState
  private neurons: Map<string, Neuron>
  private connections: Map<string, Connection>
  private spatialHash: SpatialHash
  private enablePhysics: boolean

  constructor(seed?: number, enablePhysics = true) {
    this.enablePhysics = enablePhysics

    // Initialize network state
    const initialSeed = seed ?? Math.floor(Math.random() * 1000000)
    this.state = NetworkGenerator.generateNetwork(initialSeed)

    // Create neuron and connection instances
    this.neurons = new Map()
    this.connections = new Map()
    this.spatialHash = new SpatialHash(5)

    // Populate from state
    this.state.neurons.forEach((neuronData) => {
      const neuron = Neuron.fromData(neuronData)
      this.neurons.set(neuron.id, neuron)
      this.spatialHash.insert(neuron.id, neuron.position)
    })

    this.state.connections.forEach((connData) => {
      const conn = Connection.fromData(connData)
      this.connections.set(conn.id, conn)
    })
  }

  /**
   * Add a new task neuron to the network
   */
  addTaskNeuron(taskId: string): NeuronData {
    const neuronData = NetworkGenerator.addNeuron(this.state, taskId, 'active')
    const neuron = Neuron.fromData(neuronData)

    this.neurons.set(neuron.id, neuron)
    this.spatialHash.insert(neuron.id, neuron.position)

    // Add new connections
    neuronData.connections.forEach((connectedId) => {
      const connId = Connection.generateId(neuron.id, connectedId)
      const connData = this.state.connections.get(connId)
      if (connData) {
        const conn = Connection.fromData(connData)
        this.connections.set(conn.id, conn)
      }
    })

    // Update clusters
    this.updateClusters()

    return neuronData
  }

  /**
   * Mark a neuron as completed
   */
  completeNeuron(neuronId: string): void {
    const neuron = this.neurons.get(neuronId)
    if (!neuron) return

    neuron.complete()

    // Pulse connected neurons
    neuron.connections.forEach((connectedId) => {
      const connId = Connection.generateId(neuronId, connectedId)
      const connection = this.connections.get(connId)
      if (connection) {
        connection.pulse()
      }

      const connectedNeuron = this.neurons.get(connectedId)
      if (connectedNeuron) {
        connectedNeuron.pulse(0.5)
      }
    })

    // Update state
    this.state.neurons.set(neuronId, neuron.toData())
    this.state.lastUpdateAt = Date.now()
  }

  /**
   * Delete a neuron from the network
   */
  deleteNeuron(neuronId: string): void {
    const neuron = this.neurons.get(neuronId)
    if (!neuron) return

    // Remove all connections
    neuron.connections.forEach((connectedId) => {
      const connId = Connection.generateId(neuronId, connectedId)
      const connection = this.connections.get(connId)

      if (connection) {
        // Start fading animation
        connection.startFading()
      }

      // Remove from connected neuron's list
      const connectedNeuron = this.neurons.get(connectedId)
      if (connectedNeuron) {
        connectedNeuron.disconnect(neuronId)
        this.state.neurons.set(connectedId, connectedNeuron.toData())
      }
    })

    // Remove from spatial hash
    this.spatialHash.remove(neuronId)

    // Remove from maps
    this.neurons.delete(neuronId)
    this.state.neurons.delete(neuronId)

    // Update clusters
    this.updateClusters()

    this.state.lastUpdateAt = Date.now()
  }

  /**
   * Get a neuron by ID
   */
  getNeuron(id: string): NeuronData | undefined {
    return this.state.neurons.get(id)
  }

  /**
   * Get all neurons
   */
  getAllNeurons(): NeuronData[] {
    return Array.from(this.state.neurons.values())
  }

  /**
   * Get connections for a specific neuron
   */
  getConnections(neuronId: string): ConnectionData[] {
    const neuron = this.neurons.get(neuronId)
    if (!neuron) return []

    return neuron.connections
      .map((connectedId) => {
        const connId = Connection.generateId(neuronId, connectedId)
        return this.state.connections.get(connId)
      })
      .filter((conn) => conn !== undefined) as ConnectionData[]
  }

  /**
   * Get all connections
   */
  getAllConnections(): ConnectionData[] {
    return Array.from(this.state.connections.values())
  }

  /**
   * Get all clusters
   */
  getClusters(): ClusterData[] {
    return Array.from(this.state.clusters.values())
  }

  /**
   * Get network state
   */
  getState(): NetworkState {
    return this.state
  }

  /**
   * Update simulation (called every frame)
   */
  tick(delta: number): void {
    // Update neurons
    this.neurons.forEach((neuron) => {
      neuron.update(delta)

      // Update spatial hash if position changed significantly
      const oldPos = this.spatialHash.getPosition(neuron.id)
      if (oldPos) {
        const dist = Math.sqrt(
          (neuron.position.x - oldPos.x) ** 2 +
            (neuron.position.y - oldPos.y) ** 2 +
            (neuron.position.z - oldPos.z) ** 2
        )
        if (dist > 0.5) {
          this.spatialHash.insert(neuron.id, neuron.position)
        }
      }

      // Update state
      this.state.neurons.set(neuron.id, neuron.toData())
    })

    // Update connections
    const connectionsToRemove: string[] = []
    this.connections.forEach((connection) => {
      connection.update(delta)

      if (connection.shouldRemove()) {
        connectionsToRemove.push(connection.id)
      } else {
        this.state.connections.set(connection.id, connection.toData())
      }
    })

    // Remove faded connections
    connectionsToRemove.forEach((connId) => {
      this.connections.delete(connId)
      this.state.connections.delete(connId)
    })

    // Apply force-directed layout if physics enabled
    if (this.enablePhysics) {
      const neuronArray = Array.from(this.neurons.values())
      const connectionArray = Array.from(this.connections.values())
      NetworkGenerator.applyForceDirectedLayout(neuronArray, connectionArray, delta, 1)
    }

    this.state.lastUpdateAt = Date.now()
  }

  /**
   * Update clusters based on current neuron positions
   */
  updateClusters(): void {
    const neurons = Array.from(this.state.neurons.values())
    const clusters = ClusterManager.identifyClusters(neurons)

    // Update cluster map
    this.state.clusters.clear()
    clusters.forEach((cluster) => {
      this.state.clusters.set(cluster.id, cluster)

      // Assign cluster IDs to neurons
      cluster.neurons.forEach((neuronId) => {
        const neuron = this.neurons.get(neuronId)
        if (neuron) {
          neuron.clusterId = cluster.id
          this.state.neurons.set(neuronId, neuron.toData())
        }
      })
    })
  }

  /**
   * Pulse a specific neuron
   */
  pulseNeuron(neuronId: string, intensity = 1.0, propagate = true): void {
    const neuron = this.neurons.get(neuronId)
    if (!neuron) return

    neuron.pulse(intensity)

    if (propagate) {
      // Propagate pulse to connected neurons
      neuron.connections.forEach((connectedId) => {
        const connId = Connection.generateId(neuronId, connectedId)
        const connection = this.connections.get(connId)
        if (connection) {
          connection.pulse()

          // Pulse connected neuron with reduced intensity
          const connectedNeuron = this.neurons.get(connectedId)
          if (connectedNeuron) {
            setTimeout(() => {
              connectedNeuron.pulse(intensity * 0.5)
            }, 100)
          }
        }
      })
    }

    this.state.neurons.set(neuronId, neuron.toData())
  }

  /**
   * Get neurons near a position
   */
  getNeuronsNear(position: { x: number; y: number; z: number }, radius: number): NeuronData[] {
    const nearbyIds = this.spatialHash.query(position, radius)
    return nearbyIds
      .map((id) => this.state.neurons.get(id))
      .filter((n) => n !== undefined) as NeuronData[]
  }

  /**
   * Enable/disable physics simulation
   */
  setPhysicsEnabled(enabled: boolean): void {
    this.enablePhysics = enabled
  }

  /**
   * Serialize network for persistence
   */
  serialize(): NetworkPersistence {
    const neurons: Record<string, PersistedNeuronData> = {}

    this.state.neurons.forEach((neuron) => {
      if (neuron.taskId) {
        neurons[neuron.id] = {
          taskId: neuron.taskId,
          position: neuron.position,
          ...(neuron.clusterId !== undefined && { clusterId: neuron.clusterId }),
          connections: neuron.connections,
        }
      }
    })

    return {
      seed: this.state.seed,
      neurons,
      lastSyncAt: Date.now(),
    }
  }

  /**
   * Deserialize network from persistence
   */
  deserialize(data: NetworkPersistence): void {
    // Clear current network
    this.neurons.clear()
    this.connections.clear()
    this.spatialHash.clear()
    this.state.neurons.clear()
    this.state.connections.clear()
    this.state.clusters.clear()

    // Restore seed
    this.state.seed = data.seed

    // Restore neurons
    Object.entries(data.neurons).forEach(([id, persistedData]) => {
      const neuron = new Neuron(id, persistedData.position, persistedData.taskId, 'active')
      neuron.clusterId = persistedData.clusterId
      neuron.connections = [...persistedData.connections]

      this.neurons.set(id, neuron)
      this.spatialHash.insert(id, neuron.position)
      this.state.neurons.set(id, neuron.toData())
    })

    // Recreate connections
    this.state.neurons.forEach((neuron) => {
      neuron.connections.forEach((connectedId) => {
        const connId = Connection.generateId(neuron.id, connectedId)
        if (!this.connections.has(connId)) {
          const conn = new Connection(connId, neuron.id, connectedId, 0.5, 'active')
          this.connections.set(connId, conn)
          this.state.connections.set(connId, conn.toData())
        }
      })
    })

    // Update clusters
    this.updateClusters()

    this.state.lastUpdateAt = Date.now()
  }

  /**
   * Get network statistics
   */
  getMetrics() {
    const neurons = Array.from(this.state.neurons.values())
    const connections = Array.from(this.state.connections.values())

    return {
      totalNeurons: neurons.length,
      activeNeurons: neurons.filter((n) => n.state === 'active').length,
      completedNeurons: neurons.filter((n) => n.state === 'completed').length,
      dormantNeurons: neurons.filter((n) => n.state === 'dormant').length,
      totalConnections: connections.length,
      avgConnectionsPerNeuron:
        neurons.length > 0
          ? neurons.reduce((sum, n) => sum + n.connections.length, 0) / neurons.length
          : 0,
      totalClusters: this.state.clusters.size,
    }
  }

  /**
   * Reset network to initial state
   */
  reset(seed?: number): void {
    const newSeed = seed ?? Math.floor(Math.random() * 1000000)
    this.state = NetworkGenerator.generateNetwork(newSeed)

    this.neurons.clear()
    this.connections.clear()
    this.spatialHash.clear()

    this.state.neurons.forEach((neuronData) => {
      const neuron = Neuron.fromData(neuronData)
      this.neurons.set(neuron.id, neuron)
      this.spatialHash.insert(neuron.id, neuron.position)
    })

    this.state.connections.forEach((connData) => {
      const conn = Connection.fromData(connData)
      this.connections.set(conn.id, conn)
    })
  }
}

export default NeuralNetwork

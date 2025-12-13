import type { Vector3D, NeuronState, NeuronData } from '@/types/neural'

/**
 * Neuron - Represents a single neuron in the neural network
 * Handles state transitions, energy levels, and connections
 */
export class Neuron implements NeuronData {
  id: string
  taskId: string | null
  position: Vector3D
  state: NeuronState
  size: number
  energy: number
  createdAt: number
  completedAt?: number
  clusterId?: string
  connections: string[]

  // Physics/animation properties
  private velocity: Vector3D
  private targetPosition: Vector3D | null

  constructor(
    id: string,
    position: Vector3D,
    taskId: string | null = null,
    state: NeuronState = 'active'
  ) {
    this.id = id
    this.taskId = taskId
    this.position = { ...position }
    this.state = state
    this.size = 1.0
    this.energy = state === 'active' ? 0.8 : 0.3
    this.createdAt = Date.now()
    this.connections = []
    this.velocity = { x: 0, y: 0, z: 0 }
    this.targetPosition = null
  }

  /**
   * Connect to another neuron
   */
  connect(neuronId: string): void {
    if (!this.connections.includes(neuronId)) {
      this.connections.push(neuronId)
    }
  }

  /**
   * Disconnect from a neuron
   */
  disconnect(neuronId: string): void {
    const index = this.connections.indexOf(neuronId)
    if (index !== -1) {
      this.connections.splice(index, 1)
    }
  }

  /**
   * Trigger a pulse animation
   */
  pulse(intensity = 1.0): void {
    this.energy = Math.min(1.0, this.energy + intensity * 0.3)
  }

  /**
   * Set energy level (0-1)
   */
  setEnergy(energy: number): void {
    this.energy = Math.max(0, Math.min(1, energy))
  }

  /**
   * Mark neuron as completed
   */
  complete(): void {
    if (this.state !== 'completed') {
      this.state = 'completed'
      this.completedAt = Date.now()
      this.energy = 0.5
      this.pulse(0.8)
    }
  }

  /**
   * Set neuron to dormant state
   */
  setDormant(): void {
    this.state = 'dormant'
    this.energy = 0.2
  }

  /**
   * Activate neuron
   */
  activate(): void {
    if (this.state === 'dormant') {
      this.state = 'active'
      this.energy = 0.7
    }
  }

  /**
   * Get world position (for rendering)
   */
  getWorldPosition(): Vector3D {
    return { ...this.position }
  }

  /**
   * Set target position for smooth movement
   */
  setTargetPosition(position: Vector3D): void {
    this.targetPosition = { ...position }
  }

  /**
   * Update position with physics (force-directed layout)
   */
  applyForce(force: Vector3D): void {
    this.velocity.x += force.x
    this.velocity.y += force.y
    this.velocity.z += force.z
  }

  /**
   * Update neuron physics and animation
   */
  update(delta: number, damping = 0.9): void {
    // Apply target position attraction
    if (this.targetPosition) {
      const dx = this.targetPosition.x - this.position.x
      const dy = this.targetPosition.y - this.position.y
      const dz = this.targetPosition.z - this.position.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < 0.1) {
        this.targetPosition = null
      } else {
        const strength = 0.1
        this.velocity.x += dx * strength
        this.velocity.y += dy * strength
        this.velocity.z += dz * strength
      }
    }

    // Update position based on velocity
    this.position.x += this.velocity.x * delta
    this.position.y += this.velocity.y * delta
    this.position.z += this.velocity.z * delta

    // Apply damping
    this.velocity.x *= damping
    this.velocity.y *= damping
    this.velocity.z *= damping

    // Decay energy slowly
    if (this.energy > 0.3) {
      this.energy = Math.max(0.3, this.energy - delta * 0.1)
    }
  }

  /**
   * Get distance to another position
   */
  distanceTo(position: Vector3D): number {
    const dx = this.position.x - position.x
    const dy = this.position.y - position.y
    const dz = this.position.z - position.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * Get distance to another neuron
   */
  distanceToNeuron(neuron: Neuron): number {
    return this.distanceTo(neuron.position)
  }

  /**
   * Clone neuron data
   */
  toData(): NeuronData {
    return {
      id: this.id,
      taskId: this.taskId,
      position: { ...this.position },
      state: this.state,
      size: this.size,
      energy: this.energy,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      clusterId: this.clusterId,
      connections: [...this.connections],
    }
  }

  /**
   * Create neuron from data
   */
  static fromData(data: NeuronData): Neuron {
    const neuron = new Neuron(data.id, data.position, data.taskId, data.state)
    neuron.size = data.size
    neuron.energy = data.energy
    neuron.createdAt = data.createdAt
    neuron.completedAt = data.completedAt
    neuron.clusterId = data.clusterId
    neuron.connections = [...data.connections]
    return neuron
  }
}

export default Neuron

import type { Vector3D, ConnectionState, ConnectionData } from '@/types/neural'

/**
 * Connection - Represents a synapse/connection between two neurons
 * Handles pulse animations, strength modulation, and state transitions
 */
export class Connection implements ConnectionData {
  id: string
  sourceId: string
  targetId: string
  strength: number
  state: ConnectionState
  createdAt: number
  lastPulseAt?: number

  // Animation properties
  private pulseProgress: number
  private formationProgress: number
  private fadingProgress: number

  constructor(
    id: string,
    sourceId: string,
    targetId: string,
    strength = 0.5,
    state: ConnectionState = 'forming'
  ) {
    this.id = id
    this.sourceId = sourceId
    this.targetId = targetId
    this.strength = Math.max(0, Math.min(1, strength))
    this.state = state
    this.createdAt = Date.now()
    this.pulseProgress = 0
    this.formationProgress = state === 'forming' ? 0 : 1
    this.fadingProgress = 0
  }

  /**
   * Trigger a pulse animation along the connection
   */
  pulse(): void {
    this.state = 'pulsing'
    this.pulseProgress = 0
    this.lastPulseAt = Date.now()
  }

  /**
   * Strengthen the connection (increases visual thickness)
   */
  strengthen(amount = 0.1): void {
    this.strength = Math.min(1, this.strength + amount)
  }

  /**
   * Weaken the connection
   */
  weaken(amount = 0.1): void {
    this.strength = Math.max(0.1, this.strength - amount)
  }

  /**
   * Start fading animation before removal
   */
  startFading(): void {
    this.state = 'fading'
    this.fadingProgress = 0
  }

  /**
   * Get current pulse progress (0-1)
   */
  getPulseProgress(): number {
    return this.pulseProgress
  }

  /**
   * Get formation progress (0-1)
   */
  getFormationProgress(): number {
    return this.formationProgress
  }

  /**
   * Get fading progress (0-1)
   */
  getFadingProgress(): number {
    return this.fadingProgress
  }

  /**
   * Get points along the connection for rendering
   */
  getPoints(sourcePos: Vector3D, targetPos: Vector3D, segments = 10): Vector3D[] {
    const points: Vector3D[] = []

    for (let i = 0; i <= segments; i++) {
      const t = i / segments

      // Simple linear interpolation (can be enhanced with curves)
      points.push({
        x: sourcePos.x + (targetPos.x - sourcePos.x) * t,
        y: sourcePos.y + (targetPos.y - sourcePos.y) * t,
        z: sourcePos.z + (targetPos.z - sourcePos.z) * t,
      })
    }

    return points
  }

  /**
   * Get curved points for more organic look (Catmull-Rom spline)
   */
  getCurvedPoints(
    sourcePos: Vector3D,
    targetPos: Vector3D,
    curvature = 0.3,
    segments = 16
  ): Vector3D[] {
    const points: Vector3D[] = []

    // Calculate midpoint with perpendicular offset for curve
    const midX = (sourcePos.x + targetPos.x) / 2
    const midY = (sourcePos.y + targetPos.y) / 2
    const midZ = (sourcePos.z + targetPos.z) / 2

    // Calculate perpendicular vector for curve offset
    const dx = targetPos.x - sourcePos.x
    const dy = targetPos.y - sourcePos.y
    const dz = targetPos.z - sourcePos.z
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (length < 0.001) return [sourcePos, targetPos]

    // Perpendicular offset (simple method)
    const offsetX = -dy * curvature
    const offsetY = dx * curvature
    const offsetZ = 0

    const controlPoint = {
      x: midX + offsetX,
      y: midY + offsetY,
      z: midZ + offsetZ,
    }

    // Quadratic Bezier curve
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const t1 = 1 - t

      points.push({
        x: t1 * t1 * sourcePos.x + 2 * t1 * t * controlPoint.x + t * t * targetPos.x,
        y: t1 * t1 * sourcePos.y + 2 * t1 * t * controlPoint.y + t * t * targetPos.y,
        z: t1 * t1 * sourcePos.z + 2 * t1 * t * controlPoint.z + t * t * targetPos.z,
      })
    }

    return points
  }

  /**
   * Update connection animation state
   */
  update(delta: number): void {
    // Update formation animation
    if (this.state === 'forming' && this.formationProgress < 1) {
      this.formationProgress = Math.min(1, this.formationProgress + delta * 2)
      if (this.formationProgress >= 1) {
        this.state = 'active'
      }
    }

    // Update pulse animation
    if (this.state === 'pulsing' && this.pulseProgress < 1) {
      this.pulseProgress = Math.min(1, this.pulseProgress + delta * 3)
      if (this.pulseProgress >= 1) {
        this.state = 'active'
        this.pulseProgress = 0
      }
    }

    // Update fading animation
    if (this.state === 'fading') {
      this.fadingProgress = Math.min(1, this.fadingProgress + delta * 2)
    }

    // Slowly increase strength of active connections
    if (this.state === 'active' && this.strength < 1) {
      this.strengthen(delta * 0.05)
    }
  }

  /**
   * Check if connection should be removed
   */
  shouldRemove(): boolean {
    return this.state === 'fading' && this.fadingProgress >= 1
  }

  /**
   * Get visual alpha based on state
   */
  getAlpha(): number {
    if (this.state === 'forming') {
      return this.formationProgress * this.strength
    }
    if (this.state === 'fading') {
      return (1 - this.fadingProgress) * this.strength
    }
    if (this.state === 'pulsing') {
      // Pulse causes brightness increase
      return this.strength * (1 + this.pulseProgress * 0.5)
    }
    return this.strength
  }

  /**
   * Get visual thickness multiplier based on state
   */
  getThickness(): number {
    let thickness = this.strength

    if (this.state === 'forming') {
      thickness *= this.formationProgress
    }
    if (this.state === 'pulsing') {
      // Pulse creates a wave of thickness
      thickness *= 1 + Math.sin(this.pulseProgress * Math.PI) * 0.3
    }
    if (this.state === 'fading') {
      thickness *= 1 - this.fadingProgress
    }

    return thickness
  }

  /**
   * Clone connection data
   */
  toData(): ConnectionData {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      strength: this.strength,
      state: this.state,
      createdAt: this.createdAt,
      lastPulseAt: this.lastPulseAt,
    }
  }

  /**
   * Create connection from data
   */
  static fromData(data: ConnectionData): Connection {
    const connection = new Connection(
      data.id,
      data.sourceId,
      data.targetId,
      data.strength,
      data.state
    )
    connection.createdAt = data.createdAt
    connection.lastPulseAt = data.lastPulseAt
    return connection
  }

  /**
   * Generate a unique connection ID from source and target
   */
  static generateId(sourceId: string, targetId: string): string {
    // Ensure consistent ordering for bidirectional connections
    const [id1, id2] = [sourceId, targetId].sort()
    return `conn_${id1}_${id2}`
  }
}

export default Connection

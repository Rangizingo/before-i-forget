import type { Vector3D } from '@/types/neural'

/**
 * SpatialHash - Efficient spatial lookup using grid-based partitioning
 * Used for collision detection and finding nearby neurons
 */
export class SpatialHash {
  private cellSize: number
  private grid: Map<string, Set<string>>
  private positions: Map<string, Vector3D>

  constructor(cellSize = 10) {
    this.cellSize = cellSize
    this.grid = new Map()
    this.positions = new Map()
  }

  /**
   * Get grid cell coordinates for a position
   */
  private getCellKey(position: Vector3D): string {
    const x = Math.floor(position.x / this.cellSize)
    const y = Math.floor(position.y / this.cellSize)
    const z = Math.floor(position.z / this.cellSize)
    return `${x},${y},${z}`
  }

  /**
   * Insert an object at a position
   */
  insert(id: string, position: Vector3D): void {
    // Remove from old cell if exists
    this.remove(id)

    // Add to new cell
    const cellKey = this.getCellKey(position)
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, new Set())
    }
    this.grid.get(cellKey)!.add(id)
    this.positions.set(id, { ...position })
  }

  /**
   * Remove an object from the spatial hash
   */
  remove(id: string): void {
    const position = this.positions.get(id)
    if (!position) return

    const cellKey = this.getCellKey(position)
    const cell = this.grid.get(cellKey)
    if (cell) {
      cell.delete(id)
      if (cell.size === 0) {
        this.grid.delete(cellKey)
      }
    }
    this.positions.delete(id)
  }

  /**
   * Query all objects within a radius of a position
   */
  query(position: Vector3D, radius: number): string[] {
    const results = new Set<string>()
    const radiusSq = radius * radius

    // Calculate which cells to check
    const minX = Math.floor((position.x - radius) / this.cellSize)
    const maxX = Math.floor((position.x + radius) / this.cellSize)
    const minY = Math.floor((position.y - radius) / this.cellSize)
    const maxY = Math.floor((position.y + radius) / this.cellSize)
    const minZ = Math.floor((position.z - radius) / this.cellSize)
    const maxZ = Math.floor((position.z + radius) / this.cellSize)

    // Check all nearby cells
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const cellKey = `${x},${y},${z}`
          const cell = this.grid.get(cellKey)
          if (!cell) continue

          // Check distance for each object in cell
          cell.forEach((id) => {
            const objPos = this.positions.get(id)
            if (!objPos) return

            const distSq =
              (objPos.x - position.x) ** 2 +
              (objPos.y - position.y) ** 2 +
              (objPos.z - position.z) ** 2

            if (distSq <= radiusSq) {
              results.add(id)
            }
          })
        }
      }
    }

    return Array.from(results)
  }

  /**
   * Get all neighbors within a radius of a specific object
   */
  getNeighbors(id: string, radius: number): string[] {
    const position = this.positions.get(id)
    if (!position) return []

    const neighbors = this.query(position, radius)
    // Filter out the object itself
    return neighbors.filter((neighborId) => neighborId !== id)
  }

  /**
   * Get the position of an object
   */
  getPosition(id: string): Vector3D | undefined {
    return this.positions.get(id)
  }

  /**
   * Check if a position is too close to any existing objects
   */
  hasCollision(position: Vector3D, minDistance: number, excludeId?: string): boolean {
    const nearby = this.query(position, minDistance)
    return nearby.some((id) => {
      if (excludeId && id === excludeId) return false
      const objPos = this.positions.get(id)
      if (!objPos) return false

      const distSq =
        (objPos.x - position.x) ** 2 +
        (objPos.y - position.y) ** 2 +
        (objPos.z - position.z) ** 2

      return distSq < minDistance * minDistance
    })
  }

  /**
   * Get total number of objects
   */
  size(): number {
    return this.positions.size
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.grid.clear()
    this.positions.clear()
  }

  /**
   * Get all object IDs
   */
  getAllIds(): string[] {
    return Array.from(this.positions.keys())
  }
}

export default SpatialHash

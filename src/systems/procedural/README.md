# Neural Logic System - Phase 2

This directory contains the core procedural neural network logic for the "Before I Forget" PWA todo app.

## Overview

The Neural Logic system implements an organic, procedurally-generated neural network where:
- Tasks are represented as neurons
- Completing tasks causes the network to grow and evolve
- Neurons are connected through synaptic connections
- The network uses force-directed physics for natural positioning
- Clusters automatically form based on proximity or task tags

## Architecture

### Core Classes

#### 1. **Neuron** (`Neuron.ts`)
Represents a single neuron in the network.

**Key Features:**
- Position tracking with physics simulation
- State management (active, completed, dormant)
- Energy levels affecting visual glow
- Connection management
- Pulse animation support

**Example:**
```typescript
import { Neuron } from '@/systems/procedural'

const neuron = new Neuron('neuron_1', { x: 0, y: 0, z: 0 }, 'task_123', 'active')
neuron.pulse(0.8) // Trigger pulse animation
neuron.complete() // Mark as completed
neuron.update(0.016) // Update physics (called per frame)
```

#### 2. **Connection** (`Connection.ts`)
Represents a synapse/connection between two neurons.

**Key Features:**
- Multiple states: forming, active, pulsing, fading
- Strength modulation (affects visual thickness)
- Pulse animations that travel along connections
- Bezier curve support for organic appearance

**Example:**
```typescript
import { Connection } from '@/systems/procedural'

const conn = new Connection('conn_1', 'neuron_1', 'neuron_2', 0.5, 'forming')
conn.pulse() // Trigger pulse animation
conn.strengthen(0.2) // Increase connection strength
conn.update(0.016) // Update animations
```

#### 3. **NetworkGenerator** (`NetworkGenerator.ts`)
Procedural generation engine for the neural network.

**Key Features:**
- Deterministic generation using seeds
- Force-directed layout algorithm
- Intelligent connection creation (2-4 connections per neuron)
- Collision detection using spatial hashing
- Spawns new neurons at network edge

**Example:**
```typescript
import { NetworkGenerator } from '@/systems/procedural'

// Generate initial network
const network = NetworkGenerator.generateNetwork(12345)

// Add new neuron
const neuronData = NetworkGenerator.addNeuron(network, 'task_456', 'active')

// Apply physics simulation
const neurons = Array.from(network.neurons.values()).map(Neuron.fromData)
const connections = Array.from(network.connections.values()).map(Connection.fromData)
NetworkGenerator.applyForceDirectedLayout(neurons, connections, 0.016, 1)
```

#### 4. **ClusterManager** (`ClusterManager.ts`)
Groups neurons into clusters for organization and visualization.

**Key Features:**
- Proximity-based clustering (DBSCAN-like algorithm)
- Tag/theme-based clustering
- Hybrid clustering (proximity + tag affinity)
- Cluster merging and pruning
- Centroid calculation

**Example:**
```typescript
import { ClusterManager } from '@/systems/procedural'

// Identify clusters by proximity
const clusters = ClusterManager.identifyClusters(neurons)

// Tag-based clustering
const tagClusters = ClusterManager.identifyTagBasedClusters(
  neurons,
  (taskId) => taskTagMap.get(taskId)
)

// Update cluster centroids
ClusterManager.updateClusterCentroids(clusters, neuronMap)
```

#### 5. **SpatialHash** (`SpatialHash.ts`)
Efficient spatial data structure for collision detection and neighbor queries.

**Key Features:**
- Grid-based partitioning
- O(1) insertion/removal
- Fast radius queries
- Collision detection
- Neighbor finding

**Example:**
```typescript
import { SpatialHash } from '@/systems/procedural'

const spatialHash = new SpatialHash(5) // 5 unit cells

spatialHash.insert('neuron_1', { x: 10, y: 20, z: 0 })
const nearby = spatialHash.query({ x: 10, y: 20, z: 0 }, 15) // Find within 15 units
const neighbors = spatialHash.getNeighbors('neuron_1', 10) // Neighbors of neuron_1
const hasCollision = spatialHash.hasCollision({ x: 10, y: 20, z: 0 }, 5)
```

#### 6. **NeuralNetwork** (`NeuralNetwork.ts`)
Main orchestration class combining all components.

**Key Features:**
- Complete network state management
- Task neuron creation and deletion
- Neuron completion with pulse propagation
- Physics simulation
- Serialization/deserialization for persistence
- Network metrics and statistics

**Example:**
```typescript
import { NeuralNetwork } from '@/systems/procedural'

// Create new network
const network = new NeuralNetwork(12345, true) // seed, enable physics

// Add task neurons
const neuron1 = network.addTaskNeuron('task_1')
const neuron2 = network.addTaskNeuron('task_2')

// Complete a task
network.completeNeuron(neuron1.id) // Triggers pulse propagation

// Update simulation (call every frame)
network.tick(0.016) // delta time in seconds

// Get metrics
const metrics = network.getMetrics()
console.log(`${metrics.totalNeurons} neurons, ${metrics.totalConnections} connections`)

// Persistence
const saved = network.serialize()
// Later...
network.deserialize(saved)
```

## Force-Directed Layout Algorithm

The network uses a physics-based layout algorithm with four forces:

1. **Repulsion Force**: All neurons repel each other (inverse square law)
   - Prevents overcrowding
   - Formula: `F = k / d²`

2. **Attraction Force**: Connected neurons attract each other (spring force)
   - Keeps connected neurons close
   - Formula: `F = d * k`

3. **Centering Force**: Gentle pull toward origin
   - Prevents network drift
   - Formula: `F = -position * k`

4. **Damping**: Velocity reduction over time
   - Stabilizes the network
   - Formula: `velocity *= damping`

## Configuration Constants

### NetworkGenerator
- `MIN_DISTANCE`: 5 units (minimum spacing between neurons)
- `MAX_CONNECTIONS_PER_NEURON`: 6
- `MIN_CONNECTIONS`: 2 (per new neuron)
- `MAX_CONNECTIONS`: 4 (per new neuron)
- `CONNECTION_SEARCH_RADIUS`: 20 units
- `EDGE_SPAWN_RADIUS`: 15 units

### ClusterManager
- `CLUSTER_RADIUS`: 15 units (proximity threshold)
- `MIN_CLUSTER_SIZE`: 3 neurons

### SpatialHash
- Default `cellSize`: 10 units (adjustable)

## Usage in React Components

```typescript
import { useEffect, useRef } from 'react'
import { NeuralNetwork } from '@/systems/procedural'

function NeuralNetworkVisualizer() {
  const networkRef = useRef<NeuralNetwork>()

  useEffect(() => {
    // Initialize network
    networkRef.current = new NeuralNetwork(12345, true)

    // Animation loop
    let lastTime = Date.now()
    const animate = () => {
      const now = Date.now()
      const delta = (now - lastTime) / 1000
      lastTime = now

      networkRef.current?.tick(delta)

      requestAnimationFrame(animate)
    }
    animate()

    return () => {
      // Cleanup if needed
    }
  }, [])

  const handleAddTask = (taskId: string) => {
    networkRef.current?.addTaskNeuron(taskId)
  }

  const handleCompleteTask = (neuronId: string) => {
    networkRef.current?.completeNeuron(neuronId)
  }

  // ... render logic
}
```

## Integration with Rendering System

The procedural system works seamlessly with the rendering system:

1. **NeuralNetwork** provides the logical state
2. **SceneManager** handles Three.js rendering
3. Network data flows to visual representations:
   - `NeuronData` → Three.js mesh spheres
   - `ConnectionData` → Three.js lines/tubes
   - `ClusterData` → Visual grouping effects

```typescript
import { useThreeScene } from '@/hooks/useThreeScene'
import { NeuralNetwork } from '@/systems/procedural'

function NetworkScene() {
  const { sceneManager, isReady } = useThreeScene({ autoStart: true })
  const network = useRef(new NeuralNetwork())

  useEffect(() => {
    if (!sceneManager || !isReady) return

    // Register update callback
    const unsubscribe = sceneManager.onUpdate((delta) => {
      network.current.tick(delta)

      // Sync visual representations with network state
      const neurons = network.current.getAllNeurons()
      const connections = network.current.getAllConnections()

      // Update Three.js meshes based on neuron/connection data
      // (Rendering system implementation in Phase 3)
    })

    return unsubscribe
  }, [sceneManager, isReady])

  // ... component logic
}
```

## Performance Considerations

- **Spatial Hash**: O(1) insertion, O(k) queries where k = nearby objects
- **Force-Directed Layout**: O(n²) for repulsion, O(m) for attraction (n=neurons, m=connections)
- **Clustering**: O(n²) worst case for DBSCAN-like algorithm
- **Update Frequency**: Target 60 FPS (16.6ms per frame)

Optimization tips:
- Limit force-directed iterations per frame (default: 1)
- Use larger spatial hash cells for sparse networks
- Run clustering less frequently (e.g., every 60 frames)
- Disable physics for large networks (>500 neurons)

## Testing

Example test scenarios:

```typescript
// Test 1: Network creation
const network = new NeuralNetwork(42)
expect(network.getMetrics().totalNeurons).toBeGreaterThan(0)

// Test 2: Adding neurons
const neuron = network.addTaskNeuron('test_task')
expect(network.getNeuron(neuron.id)).toBeDefined()

// Test 3: Connections
const connections = network.getConnections(neuron.id)
expect(connections.length).toBeGreaterThanOrEqual(2)
expect(connections.length).toBeLessThanOrEqual(4)

// Test 4: Completion
network.completeNeuron(neuron.id)
const updated = network.getNeuron(neuron.id)
expect(updated?.state).toBe('completed')

// Test 5: Serialization
const saved = network.serialize()
const newNetwork = new NeuralNetwork()
newNetwork.deserialize(saved)
expect(newNetwork.getMetrics().totalNeurons).toBe(network.getMetrics().totalNeurons)
```

## Next Steps (Phase 3: Rendering)

The rendering system will:
1. Create visual representations of neurons (spheres with glow)
2. Render connections as lines/tubes with particle effects
3. Implement pulse animations
4. Add camera controls and interaction
5. Layer management (active/all/completed views)
6. Post-processing effects (bloom, depth of field)

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| `SpatialHash.ts` | 167 | Spatial partitioning for efficient queries |
| `Neuron.ts` | 214 | Individual neuron representation |
| `Connection.ts` | 278 | Synaptic connections between neurons |
| `ClusterManager.ts` | 360 | Neuron clustering algorithms |
| `NetworkGenerator.ts` | 405 | Procedural network generation |
| `NeuralNetwork.ts` | 430 | Main orchestration class |
| `index.ts` | 27 | Public exports |
| **Total** | **1,881** | Complete neural logic system |

All files compile successfully with TypeScript strict mode enabled.

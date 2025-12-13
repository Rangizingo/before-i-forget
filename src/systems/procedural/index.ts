/**
 * Procedural Neural Network System
 * Phase 2: Neural Logic
 *
 * This module provides the core neural network logic for the "Before I Forget" app.
 * It handles neuron creation, connections, clustering, and procedural generation.
 */

export { Neuron } from './Neuron'
export { Connection } from './Connection'
export { NetworkGenerator } from './NetworkGenerator'
export { ClusterManager } from './ClusterManager'
export { SpatialHash } from './SpatialHash'
export { NeuralNetwork } from './NeuralNetwork'

// Re-export types for convenience
export type {
  Vector3D,
  NeuronData,
  NeuronState,
  ConnectionData,
  ConnectionState,
  ClusterData,
  NetworkState,
  NetworkPersistence,
  PersistedNeuronData,
} from '@/types/neural'

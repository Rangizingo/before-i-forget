import type * as THREE from 'three'

// ============================================================================
// Core Neural Network Types
// ============================================================================

export interface Vector2D {
  x: number
  y: number
}

export interface Vector3D extends Vector2D {
  z: number
}

// ============================================================================
// Neuron Types
// ============================================================================

export type NeuronState = 'active' | 'completed' | 'dormant'

export interface NeuronData {
  id: string
  taskId: string | null // null for procedurally generated neurons
  position: Vector3D
  state: NeuronState
  size: number // 0.5 - 2.0 scale factor
  energy: number // 0-1, affects glow intensity
  createdAt: number
  completedAt?: number
  clusterId?: string
  connections: string[] // IDs of connected neurons
}

export interface NeuronVisual {
  mesh: THREE.Mesh
  glowMesh?: THREE.Mesh
  pulsePhase: number
  targetScale: number
  currentScale: number
}

// ============================================================================
// Connection Types
// ============================================================================

export type ConnectionState = 'forming' | 'active' | 'pulsing' | 'fading'

export interface ConnectionData {
  id: string
  sourceId: string
  targetId: string
  strength: number // 0-1, affects visual thickness
  state: ConnectionState
  createdAt: number
  lastPulseAt?: number
}

export interface ConnectionVisual {
  line: THREE.Line
  particles?: THREE.Points
  pulseProgress: number // 0-1 for pulse animation
}

// ============================================================================
// Cluster Types
// ============================================================================

export interface ClusterData {
  id: string
  centroid: Vector3D
  neurons: string[]
  theme?: string // Optional category/tag grouping
  createdAt: number
}

// ============================================================================
// Layer Types (Consciousness Layers)
// ============================================================================

export type LayerType = 'active' | 'all' | 'completed'

export interface LayerConfig {
  type: LayerType
  name: string
  filterFn: (neuron: NeuronData) => boolean
  depth: number // Z-position for layer
}

// ============================================================================
// Animation Types
// ============================================================================

export type AnimationType =
  | 'pulse'
  | 'fire'
  | 'grow'
  | 'decay'
  | 'connect'
  | 'ambient'

export interface AnimationConfig {
  type: AnimationType
  duration: number
  easing: string
  delay?: number
}

export interface PulseAnimation {
  neuronId: string
  startTime: number
  duration: number
  intensity: number
  propagate: boolean // Whether to trigger connected neurons
}

export interface GrowthAnimation {
  neuronId: string
  startPosition: Vector3D
  endPosition: Vector3D
  startScale: number
  endScale: number
  startTime: number
  duration: number
}

// ============================================================================
// Network State
// ============================================================================

export interface NetworkState {
  neurons: Map<string, NeuronData>
  connections: Map<string, ConnectionData>
  clusters: Map<string, ClusterData>
  seed: number // For procedural generation consistency
  lastUpdateAt: number
}

export interface NetworkMetrics {
  totalNeurons: number
  activeNeurons: number
  completedNeurons: number
  totalConnections: number
  avgConnectionsPerNeuron: number
}

// ============================================================================
// Rendering Types
// ============================================================================

export interface RenderConfig {
  width: number
  height: number
  pixelRatio: number
  antialias: boolean
  alpha: boolean
}

export interface CameraConfig {
  fov: number
  near: number
  far: number
  position: Vector3D
  lookAt: Vector3D
}

export interface SceneConfig {
  backgroundColor: number
  ambientLightIntensity: number
  fog?: {
    color: number
    near: number
    far: number
  }
}

// ============================================================================
// Color Theme Types
// ============================================================================

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  neuronActive: string
  neuronCompleted: string
  neuronDormant: string
  connectionActive: string
  connectionPulsing: string
  glowColor: string
}

export interface ThemeConfig {
  name: string
  palette: ColorPalette
  particleDensity: number
  glowIntensity: number
  ambientSpeed: number
}

// Preset themes
export type ThemePreset =
  | 'cosmic-purple'
  | 'bioluminescent'
  | 'electric-blue'
  | 'sunset-warm'
  | 'matrix-green'
  | 'custom'

// ============================================================================
// Audio Types
// ============================================================================

export type SoundEffect =
  | 'neuron-create'
  | 'neuron-complete'
  | 'connection-form'
  | 'pulse-propagate'
  | 'layer-switch'
  | 'ambient-loop'

export interface SoundConfig {
  enabled: boolean
  masterVolume: number
  effectVolumes: Record<SoundEffect, number>
}

// ============================================================================
// Interaction Types
// ============================================================================

export interface InteractionState {
  hoveredNeuronId: string | null
  selectedNeuronId: string | null
  isDragging: boolean
  lastInteractionAt: number
}

export interface GestureConfig {
  tapThreshold: number // ms
  longPressThreshold: number // ms
  swipeThreshold: number // px
  pinchSensitivity: number
}

// ============================================================================
// Performance Types
// ============================================================================

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  visibleNeurons: number
  visibleConnections: number
}

export interface LODConfig {
  distances: number[] // Thresholds for LOD levels
  neuronDetailLevels: number[] // Segments at each LOD
  connectionDetailLevels: number[] // Line segments at each LOD
}

// ============================================================================
// Event Types
// ============================================================================

export type NeuralEventType =
  | 'neuron:created'
  | 'neuron:completed'
  | 'neuron:deleted'
  | 'connection:created'
  | 'connection:pulsed'
  | 'layer:changed'
  | 'theme:changed'

export interface NeuralEvent {
  type: NeuralEventType
  timestamp: number
  data: unknown
}

export type NeuralEventHandler = (event: NeuralEvent) => void

// ============================================================================
// Persistence Types (Firebase integration)
// ============================================================================

export interface PersistedNeuronData {
  taskId: string
  position: Vector3D
  clusterId?: string
  connections: string[]
}

export interface NetworkPersistence {
  seed: number
  neurons: Record<string, PersistedNeuronData>
  lastSyncAt: number
}

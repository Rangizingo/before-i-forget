import * as THREE from 'three'
import gsap from 'gsap'
import type { LayerType, LayerConfig, NeuronData } from '@/types/neural'

/**
 * Layer configuration presets
 */
const LAYER_CONFIGS: Record<LayerType, LayerConfig> = {
  active: {
    type: 'active',
    name: 'Active',
    filterFn: (neuron: NeuronData) => neuron.state === 'active',
    depth: 0,
  },
  all: {
    type: 'all',
    name: 'All',
    filterFn: () => true,
    depth: -10,
  },
  completed: {
    type: 'completed',
    name: 'Completed',
    filterFn: (neuron: NeuronData) => neuron.state === 'completed',
    depth: -20,
  },
}

/**
 * Layer order for navigation
 */
const LAYER_ORDER: LayerType[] = ['active', 'all', 'completed']

export interface LayerTransitionOptions {
  duration?: number
  easing?: string
  onStart?: () => void
  onComplete?: () => void
}

export interface NeuronVisibility {
  neuronId: string
  visible: boolean
  opacity: number
}

export type LayerChangeCallback = (
  layer: LayerType,
  direction: 'up' | 'down' | 'direct'
) => void

/**
 * LayerManager - Manages the layer system for neural network visualization
 * Handles Active/All/Completed views with smooth transitions
 */
export class LayerManager {
  private currentLayer: LayerType = 'active'
  private previousLayer: LayerType | null = null
  private isTransitioning = false
  private transitionProgress = 0

  // Callbacks
  private onLayerChange: LayerChangeCallback | null = null

  // Neuron visibility tracking
  private neuronVisibility: Map<string, NeuronVisibility> = new Map()

  // Animation state
  private activeAnimations: gsap.core.Tween[] = []

  constructor(initialLayer: LayerType = 'active') {
    this.currentLayer = initialLayer
  }

  /**
   * Get current layer type
   */
  getCurrentLayer(): LayerType {
    return this.currentLayer
  }

  /**
   * Get current layer configuration
   */
  getCurrentConfig(): LayerConfig {
    return LAYER_CONFIGS[this.currentLayer]
  }

  /**
   * Get all layer configurations
   */
  getAllConfigs(): Record<LayerType, LayerConfig> {
    return { ...LAYER_CONFIGS }
  }

  /**
   * Get layer name for display
   */
  getLayerName(layer?: LayerType): string {
    return LAYER_CONFIGS[layer || this.currentLayer].name
  }

  /**
   * Check if currently transitioning
   */
  getIsTransitioning(): boolean {
    return this.isTransitioning
  }

  /**
   * Get transition progress (0-1)
   */
  getTransitionProgress(): number {
    return this.transitionProgress
  }

  /**
   * Set layer change callback
   */
  setOnLayerChange(callback: LayerChangeCallback | null): void {
    this.onLayerChange = callback
  }

  /**
   * Switch to a specific layer
   */
  switchToLayer(
    layer: LayerType,
    options: LayerTransitionOptions = {}
  ): Promise<void> {
    if (layer === this.currentLayer || this.isTransitioning) {
      return Promise.resolve()
    }

    const { duration = 0.5, onStart, onComplete } = options

    return new Promise((resolve) => {
      this.isTransitioning = true
      this.previousLayer = this.currentLayer
      this.transitionProgress = 0

      onStart?.()

      // Determine direction
      const currentIndex = LAYER_ORDER.indexOf(this.currentLayer)
      const targetIndex = LAYER_ORDER.indexOf(layer)
      const direction = targetIndex > currentIndex ? 'down' : 'up'

      // Animate transition progress
      const tween = gsap.to(this, {
        transitionProgress: 1,
        duration,
        ease: 'power2.inOut',
        onComplete: () => {
          this.currentLayer = layer
          this.isTransitioning = false
          this.transitionProgress = 0
          this.previousLayer = null

          this.onLayerChange?.(layer, direction)
          onComplete?.()
          resolve()
        },
      })

      this.activeAnimations.push(tween)
    })
  }

  /**
   * Navigate to next layer (downward: Active → All → Completed)
   */
  nextLayer(options: LayerTransitionOptions = {}): Promise<void> {
    const currentIndex = LAYER_ORDER.indexOf(this.currentLayer)
    if (currentIndex < LAYER_ORDER.length - 1) {
      return this.switchToLayer(LAYER_ORDER[currentIndex + 1], options)
    }
    return Promise.resolve()
  }

  /**
   * Navigate to previous layer (upward: Completed → All → Active)
   */
  previousLayerNav(options: LayerTransitionOptions = {}): Promise<void> {
    const currentIndex = LAYER_ORDER.indexOf(this.currentLayer)
    if (currentIndex > 0) {
      return this.switchToLayer(LAYER_ORDER[currentIndex - 1], options)
    }
    return Promise.resolve()
  }

  /**
   * Check if can navigate to next layer
   */
  canGoNext(): boolean {
    const currentIndex = LAYER_ORDER.indexOf(this.currentLayer)
    return currentIndex < LAYER_ORDER.length - 1
  }

  /**
   * Check if can navigate to previous layer
   */
  canGoPrevious(): boolean {
    const currentIndex = LAYER_ORDER.indexOf(this.currentLayer)
    return currentIndex > 0
  }

  /**
   * Filter neurons based on current layer
   */
  filterNeurons(neurons: NeuronData[]): NeuronData[] {
    const config = LAYER_CONFIGS[this.currentLayer]
    return neurons.filter(config.filterFn)
  }

  /**
   * Check if a neuron should be visible in current layer
   */
  isNeuronVisible(neuron: NeuronData): boolean {
    const config = LAYER_CONFIGS[this.currentLayer]
    return config.filterFn(neuron)
  }

  /**
   * Get opacity for a neuron based on layer and state
   */
  getNeuronOpacity(neuron: NeuronData): number {
    const isVisible = this.isNeuronVisible(neuron)

    if (!isVisible) {
      return 0
    }

    // In completed layer, completed neurons are slightly dimmed
    if (this.currentLayer === 'completed') {
      return 0.7
    }

    // In all layer, completed neurons are more dimmed
    if (this.currentLayer === 'all' && neuron.state === 'completed') {
      return 0.5
    }

    return 1
  }

  /**
   * Get pulse speed modifier for current layer
   */
  getPulseSpeedModifier(neuron: NeuronData): number {
    // Completed neurons pulse slower
    if (neuron.state === 'completed') {
      return 0.3
    }

    // In completed layer, everything pulses slower
    if (this.currentLayer === 'completed') {
      return 0.5
    }

    return 1
  }

  /**
   * Update neuron visibility with transition animations
   */
  updateNeuronVisibility(
    neurons: NeuronData[],
    meshMap: Map<string, THREE.Object3D>,
    duration = 0.3
  ): void {
    neurons.forEach((neuron) => {
      const mesh = meshMap.get(neuron.id)
      if (!mesh) return

      const targetOpacity = this.getNeuronOpacity(neuron)
      const targetVisible = targetOpacity > 0

      // Get material(s)
      const materials: THREE.Material[] = []
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            materials.push(...child.material)
          } else {
            materials.push(child.material)
          }
        }
      })

      // Animate opacity
      materials.forEach((material) => {
        if ('opacity' in material) {
          gsap.to(material, {
            opacity: targetOpacity,
            duration,
            ease: 'power2.out',
            onStart: () => {
              if (targetVisible) {
                mesh.visible = true
              }
            },
            onComplete: () => {
              mesh.visible = targetVisible
            },
          })
        }
      })

      // Update tracking
      this.neuronVisibility.set(neuron.id, {
        neuronId: neuron.id,
        visible: targetVisible,
        opacity: targetOpacity,
      })
    })
  }

  /**
   * Get layer depth for camera positioning
   */
  getLayerDepth(): number {
    return LAYER_CONFIGS[this.currentLayer].depth
  }

  /**
   * Get interpolated depth during transition
   */
  getInterpolatedDepth(): number {
    if (!this.isTransitioning || !this.previousLayer) {
      return this.getLayerDepth()
    }

    const fromDepth = LAYER_CONFIGS[this.previousLayer].depth
    const toDepth = LAYER_CONFIGS[this.currentLayer].depth

    return fromDepth + (toDepth - fromDepth) * this.transitionProgress
  }

  /**
   * Get layer index (0 = Active, 1 = All, 2 = Completed)
   */
  getLayerIndex(layer?: LayerType): number {
    return LAYER_ORDER.indexOf(layer || this.currentLayer)
  }

  /**
   * Get total number of layers
   */
  getTotalLayers(): number {
    return LAYER_ORDER.length
  }

  /**
   * Cancel all active animations
   */
  cancelAnimations(): void {
    this.activeAnimations.forEach((tween) => tween.kill())
    this.activeAnimations = []
    this.isTransitioning = false
    this.transitionProgress = 0
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.cancelAnimations()
    this.neuronVisibility.clear()
    this.onLayerChange = null
  }
}

export default LayerManager

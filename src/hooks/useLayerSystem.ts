import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { LayerManager, type LayerTransitionOptions } from '@/systems/layer'
import type { LayerType, NeuronData } from '@/types/neural'

export interface UseLayerSystemOptions {
  initialLayer?: LayerType
  onLayerChange?: (layer: LayerType, direction: 'up' | 'down' | 'direct') => void
}

export interface UseLayerSystemReturn {
  currentLayer: LayerType
  layerName: string
  layerIndex: number
  totalLayers: number
  isTransitioning: boolean
  canGoNext: boolean
  canGoPrevious: boolean
  switchToLayer: (layer: LayerType, options?: LayerTransitionOptions) => Promise<void>
  nextLayer: (options?: LayerTransitionOptions) => Promise<void>
  previousLayer: (options?: LayerTransitionOptions) => Promise<void>
  filterNeurons: (neurons: NeuronData[]) => NeuronData[]
  isNeuronVisible: (neuron: NeuronData) => boolean
  getNeuronOpacity: (neuron: NeuronData) => number
  getPulseSpeedModifier: (neuron: NeuronData) => number
  updateNeuronVisibility: (
    neurons: NeuronData[],
    meshMap: Map<string, THREE.Object3D>,
    duration?: number
  ) => void
  layerManager: LayerManager | null
}

/**
 * React hook for managing the layer system
 * Provides layer navigation, filtering, and transition animations
 */
export function useLayerSystem(
  options: UseLayerSystemOptions = {}
): UseLayerSystemReturn {
  const { initialLayer = 'active', onLayerChange } = options

  const layerManagerRef = useRef<LayerManager | null>(null)
  const [currentLayer, setCurrentLayer] = useState<LayerType>(initialLayer)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Initialize LayerManager
  useEffect(() => {
    const manager = new LayerManager(initialLayer)

    manager.setOnLayerChange((layer, direction) => {
      setCurrentLayer(layer)
      setIsTransitioning(false)
      onLayerChange?.(layer, direction)
    })

    layerManagerRef.current = manager

    return () => {
      manager.dispose()
      layerManagerRef.current = null
    }
  }, []) // Only run once on mount

  // Update callback when it changes
  useEffect(() => {
    if (layerManagerRef.current) {
      layerManagerRef.current.setOnLayerChange((layer, direction) => {
        setCurrentLayer(layer)
        setIsTransitioning(false)
        onLayerChange?.(layer, direction)
      })
    }
  }, [onLayerChange])

  // Switch to a specific layer
  const switchToLayer = useCallback(
    async (layer: LayerType, transitionOptions: LayerTransitionOptions = {}) => {
      if (!layerManagerRef.current) return

      setIsTransitioning(true)
      await layerManagerRef.current.switchToLayer(layer, transitionOptions)
    },
    []
  )

  // Navigate to next layer
  const nextLayer = useCallback(
    async (transitionOptions: LayerTransitionOptions = {}) => {
      if (!layerManagerRef.current) return

      if (layerManagerRef.current.canGoNext()) {
        setIsTransitioning(true)
        await layerManagerRef.current.nextLayer(transitionOptions)
      }
    },
    []
  )

  // Navigate to previous layer
  const previousLayer = useCallback(
    async (transitionOptions: LayerTransitionOptions = {}) => {
      if (!layerManagerRef.current) return

      if (layerManagerRef.current.canGoPrevious()) {
        setIsTransitioning(true)
        await layerManagerRef.current.previousLayerNav(transitionOptions)
      }
    },
    []
  )

  // Filter neurons by current layer
  const filterNeurons = useCallback((neurons: NeuronData[]) => {
    if (!layerManagerRef.current) return neurons
    return layerManagerRef.current.filterNeurons(neurons)
  }, [])

  // Check if neuron is visible in current layer
  const isNeuronVisible = useCallback((neuron: NeuronData) => {
    if (!layerManagerRef.current) return true
    return layerManagerRef.current.isNeuronVisible(neuron)
  }, [])

  // Get neuron opacity based on layer
  const getNeuronOpacity = useCallback((neuron: NeuronData) => {
    if (!layerManagerRef.current) return 1
    return layerManagerRef.current.getNeuronOpacity(neuron)
  }, [])

  // Get pulse speed modifier
  const getPulseSpeedModifier = useCallback((neuron: NeuronData) => {
    if (!layerManagerRef.current) return 1
    return layerManagerRef.current.getPulseSpeedModifier(neuron)
  }, [])

  // Update neuron visibility with animations
  const updateNeuronVisibility = useCallback(
    (
      neurons: NeuronData[],
      meshMap: Map<string, THREE.Object3D>,
      duration = 0.3
    ) => {
      if (!layerManagerRef.current) return
      layerManagerRef.current.updateNeuronVisibility(neurons, meshMap, duration)
    },
    []
  )

  // Derived state
  const canGoNext = layerManagerRef.current?.canGoNext() ?? false
  const canGoPrevious = layerManagerRef.current?.canGoPrevious() ?? false
  const layerName = layerManagerRef.current?.getLayerName() ?? 'Active'
  const layerIndex = layerManagerRef.current?.getLayerIndex() ?? 0
  const totalLayers = layerManagerRef.current?.getTotalLayers() ?? 3

  return {
    currentLayer,
    layerName,
    layerIndex,
    totalLayers,
    isTransitioning,
    canGoNext,
    canGoPrevious,
    switchToLayer,
    nextLayer,
    previousLayer,
    filterNeurons,
    isNeuronVisible,
    getNeuronOpacity,
    getPulseSpeedModifier,
    updateNeuronVisibility,
    layerManager: layerManagerRef.current,
  }
}

export default useLayerSystem

import type { LayerType, NeuronData, NeuronState } from '@/types/neural'

/**
 * Style configuration for neurons based on layer and state
 */
export interface NeuronLayerStyle {
  opacity: number
  glowIntensity: number
  pulseSpeed: number
  saturation: number
  scale: number
  connectionOpacity: number
}

/**
 * Default styles for each neuron state
 */
const STATE_BASE_STYLES: Record<NeuronState, Partial<NeuronLayerStyle>> = {
  active: {
    opacity: 1,
    glowIntensity: 1,
    pulseSpeed: 1,
    saturation: 1,
    scale: 1,
  },
  completed: {
    opacity: 0.6,
    glowIntensity: 0.3,
    pulseSpeed: 0.3,
    saturation: 0.5,
    scale: 0.9,
  },
  dormant: {
    opacity: 0.4,
    glowIntensity: 0.1,
    pulseSpeed: 0.1,
    saturation: 0.3,
    scale: 0.8,
  },
}

/**
 * Layer-specific style modifiers
 */
const LAYER_MODIFIERS: Record<LayerType, Partial<NeuronLayerStyle>> = {
  active: {
    // Active layer shows active neurons at full intensity
    connectionOpacity: 1,
  },
  all: {
    // All layer shows everything, completed slightly dimmed
    connectionOpacity: 0.7,
  },
  completed: {
    // Completed layer has dimmer overall aesthetic
    opacity: 0.8,
    glowIntensity: 0.5,
    pulseSpeed: 0.5,
    connectionOpacity: 0.4,
  },
}

/**
 * Get complete style for a neuron based on its state and current layer
 */
export function getNeuronLayerStyle(
  neuron: NeuronData,
  currentLayer: LayerType
): NeuronLayerStyle {
  // Start with defaults
  const style: NeuronLayerStyle = {
    opacity: 1,
    glowIntensity: 1,
    pulseSpeed: 1,
    saturation: 1,
    scale: 1,
    connectionOpacity: 1,
  }

  // Apply base state styles
  const stateStyle = STATE_BASE_STYLES[neuron.state]
  Object.assign(style, stateStyle)

  // Apply layer modifiers
  const layerModifier = LAYER_MODIFIERS[currentLayer]

  // Multiply modifiers instead of replacing
  if (layerModifier.opacity !== undefined) {
    style.opacity *= layerModifier.opacity
  }
  if (layerModifier.glowIntensity !== undefined) {
    style.glowIntensity *= layerModifier.glowIntensity
  }
  if (layerModifier.pulseSpeed !== undefined) {
    style.pulseSpeed *= layerModifier.pulseSpeed
  }
  if (layerModifier.connectionOpacity !== undefined) {
    style.connectionOpacity *= layerModifier.connectionOpacity
  }

  // Special case: in completed layer, even active neurons should be dimmer
  if (currentLayer === 'completed' && neuron.state === 'active') {
    style.opacity *= 0.7
    style.glowIntensity *= 0.6
  }

  // Special case: completed neurons in active layer should be very dim
  if (currentLayer === 'active' && neuron.state === 'completed') {
    style.opacity = 0
  }

  // Special case: active neurons in completed layer (shouldn't happen, but handle gracefully)
  if (currentLayer === 'completed' && neuron.state === 'active') {
    style.opacity = 0
  }

  return style
}

/**
 * Get connection style based on connected neurons and layer
 */
export function getConnectionLayerStyle(
  sourceNeuron: NeuronData,
  targetNeuron: NeuronData,
  currentLayer: LayerType
): { opacity: number; pulseSpeed: number } {
  const sourceStyle = getNeuronLayerStyle(sourceNeuron, currentLayer)
  const targetStyle = getNeuronLayerStyle(targetNeuron, currentLayer)

  // Connection visibility is the minimum of both endpoints
  const opacity = Math.min(sourceStyle.opacity, targetStyle.opacity) *
                  Math.min(sourceStyle.connectionOpacity, targetStyle.connectionOpacity)

  // Pulse speed is average of both endpoints
  const pulseSpeed = (sourceStyle.pulseSpeed + targetStyle.pulseSpeed) / 2

  return { opacity, pulseSpeed }
}

/**
 * Get colors adjusted for completed layer
 */
export function getLayerColors(currentLayer: LayerType): {
  neuronColor: number
  completedColor: number
  connectionColor: number
  glowColor: number
  backgroundColor: number
} {
  const baseColors = {
    neuronColor: 0x8b5cf6, // Purple
    completedColor: 0x4a5568, // Gray
    connectionColor: 0x8b5cf6, // Purple
    glowColor: 0x06b6d4, // Cyan
    backgroundColor: 0x0a0a1a, // Dark blue
  }

  if (currentLayer === 'completed') {
    return {
      ...baseColors,
      neuronColor: 0x6366f1, // Indigo (slightly different)
      connectionColor: 0x4a5568, // Gray
      glowColor: 0x4a5568, // Gray glow
    }
  }

  return baseColors
}

/**
 * Get CSS transition classes for layer changes
 */
export function getLayerTransitionClass(
  isEntering: boolean,
  isExiting: boolean
): string {
  if (isEntering) return 'layer-enter'
  if (isExiting) return 'layer-exit'
  return ''
}

export default {
  getNeuronLayerStyle,
  getConnectionLayerStyle,
  getLayerColors,
  getLayerTransitionClass,
}

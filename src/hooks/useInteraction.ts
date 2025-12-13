import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import type { SceneManager } from '@/systems/rendering'
import {
  InteractionManager,
  GestureHandler,
  InteractionVisuals,
  type InteractionCallbacks,
  type InteractionOptions,
  type GestureCallbacks,
  type VisualOptions,
} from '@/systems/interaction'
import type { InteractionState, GestureConfig } from '@/types/neural'

export interface UseInteractionOptions {
  sceneManager: SceneManager | null
  interactableObjects?: THREE.Object3D[]
  interactionOptions?: InteractionOptions
  visualOptions?: VisualOptions
  gestureConfig?: Partial<GestureConfig>
  onHover?: (neuronId: string | null) => void
  onSelect?: (neuronId: string) => void
  onDeselect?: () => void
  onDragStart?: (neuronId: string, position: THREE.Vector3) => void
  onDrag?: (neuronId: string, position: THREE.Vector3) => void
  onDragEnd?: (neuronId: string, position: THREE.Vector3) => void
  onDoubleClick?: (neuronId: string) => void
  onLongPress?: (neuronId: string, position: { x: number; y: number }) => void
  onContextMenu?: (neuronId: string, position: { x: number; y: number }) => void
  onPinchZoom?: (scale: number, center: { x: number; y: number }) => void
  onTwoFingerPan?: (deltaX: number, deltaY: number) => void
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void
  onRotate?: (angle: number, center: { x: number; y: number }) => void
}

export interface UseInteractionReturn {
  interactionState: InteractionState
  selectNeuron: (neuronId: string | null) => void
  setInteractableObjects: (objects: THREE.Object3D[]) => void
  isGesturing: boolean
}

/**
 * React hook for managing neural network interactions
 * Handles hover, click, drag, touch gestures, and visual feedback
 */
export function useInteraction(options: UseInteractionOptions): UseInteractionReturn {
  const {
    sceneManager,
    interactableObjects = [],
    interactionOptions,
    visualOptions,
    gestureConfig,
    onHover,
    onSelect,
    onDeselect,
    onDragStart,
    onDrag,
    onDragEnd,
    onDoubleClick,
    onLongPress,
    onContextMenu,
    onPinchZoom,
    onTwoFingerPan,
    onSwipe,
    onRotate,
  } = options

  // Refs for managers
  const interactionManagerRef = useRef<InteractionManager | null>(null)
  const gestureHandlerRef = useRef<GestureHandler | null>(null)
  const visualsRef = useRef<InteractionVisuals | null>(null)

  // State
  const [interactionState, setInteractionState] = useState<InteractionState>({
    hoveredNeuronId: null,
    selectedNeuronId: null,
    isDragging: false,
    lastInteractionAt: 0,
  })
  const [isGesturing, setIsGesturing] = useState(false)

  // Initialize interaction systems
  useEffect(() => {
    if (!sceneManager) return

    const scene = sceneManager.getScene()

    // Create InteractionVisuals
    const visuals = new InteractionVisuals(scene, visualOptions)
    visualsRef.current = visuals

    // Setup InteractionManager callbacks
    const interactionCallbacks: InteractionCallbacks = {
      onHover: (neuronId) => {
        setInteractionState((prev) => ({
          ...prev,
          hoveredNeuronId: neuronId,
          lastInteractionAt: Date.now(),
        }))

        // Update visual feedback
        if (neuronId && interactableObjects.length > 0) {
          const object = interactableObjects.find(
            (obj) => obj.userData.neuronId === neuronId
          )
          if (object) {
            visuals.showHover(object)
          }
        } else {
          visuals.showHover(null)
        }

        onHover?.(neuronId)
      },

      onSelect: (neuronId) => {
        setInteractionState((prev) => ({
          ...prev,
          selectedNeuronId: neuronId,
          lastInteractionAt: Date.now(),
        }))

        // Update visual feedback
        if (neuronId && interactableObjects.length > 0) {
          const object = interactableObjects.find(
            (obj) => obj.userData.neuronId === neuronId
          )
          if (object) {
            visuals.showSelection(object)
          }
        }

        onSelect?.(neuronId)
      },

      onDeselect: () => {
        setInteractionState((prev) => ({
          ...prev,
          selectedNeuronId: null,
          lastInteractionAt: Date.now(),
        }))

        visuals.showSelection(null)
        onDeselect?.()
      },

      onDragStart: (neuronId, position) => {
        setInteractionState((prev) => ({
          ...prev,
          isDragging: true,
          lastInteractionAt: Date.now(),
        }))

        // Show drag ghost
        const object = interactableObjects.find(
          (obj) => obj.userData.neuronId === neuronId
        )
        if (object) {
          visuals.showDragGhost(object, position)
        }

        onDragStart?.(neuronId, position)
      },

      onDrag: (neuronId, position) => {
        visuals.updateDragGhost(position)
        onDrag?.(neuronId, position)
      },

      onDragEnd: (neuronId, position) => {
        setInteractionState((prev) => ({
          ...prev,
          isDragging: false,
          lastInteractionAt: Date.now(),
        }))

        visuals.hideDragGhost()
        onDragEnd?.(neuronId, position)
      },

      onDoubleClick: (neuronId) => {
        onDoubleClick?.(neuronId)
      },

      onLongPress: (neuronId, position) => {
        onLongPress?.(neuronId, position)
      },

      onContextMenu: (neuronId, position) => {
        onContextMenu?.(neuronId, position)
      },
    }

    // Create InteractionManager
    const interactionManager = new InteractionManager(
      sceneManager,
      interactionCallbacks,
      interactionOptions
    )
    interactionManagerRef.current = interactionManager

    // Setup GestureHandler callbacks
    const gestureCallbacks: GestureCallbacks = {
      onPinchZoom: (scale, center) => {
        setIsGesturing(true)
        onPinchZoom?.(scale, center)
      },

      onTwoFingerPan: (deltaX, deltaY) => {
        setIsGesturing(true)
        onTwoFingerPan?.(deltaX, deltaY)
      },

      onSwipe: (direction, velocity) => {
        onSwipe?.(direction, velocity)
      },

      onRotate: (angle, center) => {
        setIsGesturing(true)
        onRotate?.(angle, center)
      },
    }

    // Create GestureHandler
    const gestureHandler = new GestureHandler(
      sceneManager.getContainer(),
      gestureCallbacks,
      gestureConfig
    )
    gestureHandlerRef.current = gestureHandler

    // Update gesture state
    const checkGestureState = setInterval(() => {
      setIsGesturing(gestureHandler.isActive())
    }, 100)

    // Register update callback for animations
    const unsubscribe = sceneManager.onUpdate((delta) => {
      visuals.update(delta)
    })

    // Cleanup
    return () => {
      clearInterval(checkGestureState)
      unsubscribe()
      interactionManager.dispose()
      gestureHandler.dispose()
      visuals.dispose()
      interactionManagerRef.current = null
      gestureHandlerRef.current = null
      visualsRef.current = null
    }
  }, [sceneManager]) // Only recreate when sceneManager changes

  // Update interactable objects when they change
  useEffect(() => {
    if (interactionManagerRef.current) {
      interactionManagerRef.current.setInteractableObjects(interactableObjects)
    }
  }, [interactableObjects])

  // Update callbacks when they change
  useEffect(() => {
    if (interactionManagerRef.current) {
      interactionManagerRef.current.setCallbacks({
        onHover,
        onSelect,
        onDeselect,
        onDragStart,
        onDrag,
        onDragEnd,
        onDoubleClick,
        onLongPress,
        onContextMenu,
      })
    }
  }, [
    onHover,
    onSelect,
    onDeselect,
    onDragStart,
    onDrag,
    onDragEnd,
    onDoubleClick,
    onLongPress,
    onContextMenu,
  ])

  useEffect(() => {
    if (gestureHandlerRef.current) {
      gestureHandlerRef.current.setCallbacks({
        onPinchZoom,
        onTwoFingerPan,
        onSwipe,
        onRotate,
      })
    }
  }, [onPinchZoom, onTwoFingerPan, onSwipe, onRotate])

  // Programmatic neuron selection
  const selectNeuron = useCallback((neuronId: string | null) => {
    interactionManagerRef.current?.selectNeuron(neuronId)
  }, [])

  // Update interactable objects
  const setInteractableObjects = useCallback((objects: THREE.Object3D[]) => {
    interactionManagerRef.current?.setInteractableObjects(objects)
  }, [])

  return {
    interactionState,
    selectNeuron,
    setInteractableObjects,
    isGesturing,
  }
}

export default useInteraction

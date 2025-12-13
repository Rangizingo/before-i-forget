import * as THREE from 'three'
import type { SceneManager } from '@/systems/rendering'
import type { InteractionState, GestureConfig } from '@/types/neural'

export interface InteractionCallbacks {
  onHover?: (neuronId: string | null) => void
  onSelect?: (neuronId: string) => void
  onDeselect?: () => void
  onDragStart?: (neuronId: string, position: THREE.Vector3) => void
  onDrag?: (neuronId: string, position: THREE.Vector3) => void
  onDragEnd?: (neuronId: string, position: THREE.Vector3) => void
  onDoubleClick?: (neuronId: string) => void
  onLongPress?: (neuronId: string, position: { x: number; y: number }) => void
  onContextMenu?: (neuronId: string, position: { x: number; y: number }) => void
}

export interface InteractionOptions {
  gestureConfig?: Partial<GestureConfig>
  enableDrag?: boolean
  enableHover?: boolean
  enableContextMenu?: boolean
}

/**
 * InteractionManager - Manages mouse/touch interactions with neurons
 * Handles raycasting, hover, click, drag, and gesture detection
 */
export class InteractionManager {
  private sceneManager: SceneManager
  private container: HTMLElement
  private interactableObjects: THREE.Object3D[] = []
  private callbacks: InteractionCallbacks
  private gestureConfig: GestureConfig

  // State
  private state: InteractionState = {
    hoveredNeuronId: null,
    selectedNeuronId: null,
    isDragging: false,
    lastInteractionAt: 0,
  }

  // Drag state
  private dragState = {
    startX: 0,
    startY: 0,
    startPosition: new THREE.Vector3(),
    hasMoved: false,
  }

  // Touch/click timing
  private lastClickTime = 0
  private clickTimer: ReturnType<typeof setTimeout> | null = null
  private longPressTimer: ReturnType<typeof setTimeout> | null = null

  // Options
  private options: {
    enableDrag: boolean
    enableHover: boolean
    enableContextMenu: boolean
    gestureConfig: Partial<GestureConfig>
  }

  constructor(
    sceneManager: SceneManager,
    callbacks: InteractionCallbacks = {},
    options: InteractionOptions = {}
  ) {
    this.sceneManager = sceneManager
    this.container = sceneManager.getContainer()
    this.callbacks = callbacks

    this.gestureConfig = {
      tapThreshold: 200,
      longPressThreshold: 500,
      swipeThreshold: 10,
      pinchSensitivity: 1.0,
      ...options.gestureConfig,
    }

    this.options = {
      enableDrag: true,
      enableHover: true,
      enableContextMenu: true,
      gestureConfig: {},
      ...options,
    }

    this.attachEventListeners()
  }

  /**
   * Set the objects that can be interacted with
   */
  setInteractableObjects(objects: THREE.Object3D[]): void {
    this.interactableObjects = objects
  }

  /**
   * Get current interaction state
   */
  getState(): Readonly<InteractionState> {
    return { ...this.state }
  }

  /**
   * Get neuron ID from a THREE object
   */
  private getNeuronIdFromObject(object: THREE.Object3D): string | null {
    // Check if object has userData with neuronId
    if (object.userData && object.userData.neuronId) {
      return object.userData.neuronId
    }
    // Check parent objects
    let current = object.parent
    while (current) {
      if (current.userData && current.userData.neuronId) {
        return current.userData.neuronId
      }
      current = current.parent
    }
    return null
  }

  /**
   * Perform raycast to find intersected neurons
   */
  private raycastNeurons(clientX: number, clientY: number): string | null {
    if (this.interactableObjects.length === 0) return null

    const intersections = this.sceneManager.raycast(
      clientX,
      clientY,
      this.interactableObjects
    )

    if (intersections.length > 0) {
      return this.getNeuronIdFromObject(intersections[0].object)
    }

    return null
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove = (event: MouseEvent): void => {
    const { clientX, clientY } = event

    if (this.state.isDragging) {
      this.handleDragMove(clientX, clientY)
      return
    }

    if (this.options.enableHover) {
      this.handleHover(clientX, clientY)
    }
  }

  /**
   * Handle hover state
   */
  private handleHover(clientX: number, clientY: number): void {
    const neuronId = this.raycastNeurons(clientX, clientY)

    if (neuronId !== this.state.hoveredNeuronId) {
      this.state.hoveredNeuronId = neuronId
      this.state.lastInteractionAt = Date.now()
      this.callbacks.onHover?.(neuronId)
    }
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown = (event: MouseEvent): void => {
    // Prevent context menu on right-click if we're handling it
    if (event.button === 2 && this.options.enableContextMenu) {
      event.preventDefault()
    }

    const { clientX, clientY } = event
    const neuronId = this.raycastNeurons(clientX, clientY)

    if (!neuronId) {
      // Click on empty space - deselect
      if (this.state.selectedNeuronId) {
        this.state.selectedNeuronId = null
        this.callbacks.onDeselect?.()
      }
      return
    }

    // Left click
    if (event.button === 0) {
      this.handleLeftClick(neuronId, clientX, clientY)
    }
    // Right click
    else if (event.button === 2 && this.options.enableContextMenu) {
      this.handleContextMenu(neuronId, clientX, clientY)
    }
  }

  /**
   * Handle left click on neuron
   */
  private handleLeftClick(neuronId: string, clientX: number, clientY: number): void {
    const now = Date.now()
    const timeSinceLastClick = now - this.lastClickTime

    // Check for double-click
    if (timeSinceLastClick < this.gestureConfig.tapThreshold) {
      this.handleDoubleClick(neuronId)
      this.lastClickTime = 0
      if (this.clickTimer) {
        clearTimeout(this.clickTimer)
        this.clickTimer = null
      }
      return
    }

    this.lastClickTime = now

    // Setup drag state
    if (this.options.enableDrag) {
      this.dragState.startX = clientX
      this.dragState.startY = clientY
      this.dragState.hasMoved = false

      const worldPos = this.sceneManager.screenToWorld(clientX, clientY)
      this.dragState.startPosition.copy(worldPos)
    }

    // Start long-press timer
    this.longPressTimer = setTimeout(() => {
      this.handleLongPress(neuronId, clientX, clientY)
    }, this.gestureConfig.longPressThreshold)

    // Delay single-click to detect double-click
    this.clickTimer = setTimeout(() => {
      if (!this.state.isDragging) {
        this.handleSingleClick(neuronId)
      }
      this.clickTimer = null
    }, this.gestureConfig.tapThreshold)
  }

  /**
   * Handle single click (delayed to detect double-click)
   */
  private handleSingleClick(neuronId: string): void {
    this.state.selectedNeuronId = neuronId
    this.state.lastInteractionAt = Date.now()
    this.callbacks.onSelect?.(neuronId)
  }

  /**
   * Handle double-click
   */
  private handleDoubleClick(neuronId: string): void {
    this.state.lastInteractionAt = Date.now()
    this.callbacks.onDoubleClick?.(neuronId)
  }

  /**
   * Handle long-press
   */
  private handleLongPress(neuronId: string, clientX: number, clientY: number): void {
    if (this.state.isDragging || this.dragState.hasMoved) return

    this.state.lastInteractionAt = Date.now()
    this.callbacks.onLongPress?.(neuronId, { x: clientX, y: clientY })
  }

  /**
   * Handle context menu (right-click)
   */
  private handleContextMenu(neuronId: string, clientX: number, clientY: number): void {
    this.state.lastInteractionAt = Date.now()
    this.callbacks.onContextMenu?.(neuronId, { x: clientX, y: clientY })
  }

  /**
   * Handle drag move
   */
  private handleDragMove(clientX: number, clientY: number): void {
    const dx = clientX - this.dragState.startX
    const dy = clientY - this.dragState.startY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Check if we've moved enough to start dragging
    if (!this.state.isDragging && distance > this.gestureConfig.swipeThreshold) {
      this.state.isDragging = true
      this.dragState.hasMoved = true

      // Cancel click and long-press timers
      if (this.clickTimer) {
        clearTimeout(this.clickTimer)
        this.clickTimer = null
      }
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }

      if (this.state.selectedNeuronId) {
        this.callbacks.onDragStart?.(this.state.selectedNeuronId, this.dragState.startPosition)
      }
    }

    if (this.state.isDragging && this.state.selectedNeuronId) {
      const worldPos = this.sceneManager.screenToWorld(clientX, clientY)
      this.callbacks.onDrag?.(this.state.selectedNeuronId, worldPos)
    }
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp = (event: MouseEvent): void => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    if (this.state.isDragging && this.state.selectedNeuronId) {
      const worldPos = this.sceneManager.screenToWorld(event.clientX, event.clientY)
      this.callbacks.onDragEnd?.(this.state.selectedNeuronId, worldPos)
    }

    this.state.isDragging = false
    this.dragState.hasMoved = false
  }

  /**
   * Handle context menu event (prevent default)
   */
  private handleContextMenuEvent = (event: Event): void => {
    if (this.options.enableContextMenu) {
      event.preventDefault()
    }
  }

  /**
   * Handle mouse leave
   */
  private handleMouseLeave = (): void => {
    if (this.state.hoveredNeuronId) {
      this.state.hoveredNeuronId = null
      this.callbacks.onHover?.(null)
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    this.container.addEventListener('mousemove', this.handleMouseMove)
    this.container.addEventListener('mousedown', this.handleMouseDown)
    this.container.addEventListener('mouseup', this.handleMouseUp)
    this.container.addEventListener('mouseleave', this.handleMouseLeave)
    this.container.addEventListener('contextmenu', this.handleContextMenuEvent)
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners(): void {
    this.container.removeEventListener('mousemove', this.handleMouseMove)
    this.container.removeEventListener('mousedown', this.handleMouseDown)
    this.container.removeEventListener('mouseup', this.handleMouseUp)
    this.container.removeEventListener('mouseleave', this.handleMouseLeave)
    this.container.removeEventListener('contextmenu', this.handleContextMenuEvent)
  }

  /**
   * Update callbacks
   */
  setCallbacks(callbacks: InteractionCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Select neuron programmatically
   */
  selectNeuron(neuronId: string | null): void {
    if (neuronId !== this.state.selectedNeuronId) {
      this.state.selectedNeuronId = neuronId
      this.state.lastInteractionAt = Date.now()
      if (neuronId) {
        this.callbacks.onSelect?.(neuronId)
      } else {
        this.callbacks.onDeselect?.()
      }
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.detachEventListeners()
    if (this.clickTimer) {
      clearTimeout(this.clickTimer)
    }
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
    }
    this.interactableObjects = []
  }
}

export default InteractionManager

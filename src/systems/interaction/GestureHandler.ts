import type { GestureConfig } from '@/types/neural'

export interface GestureCallbacks {
  onPinchZoom?: (scale: number, center: { x: number; y: number }) => void
  onTwoFingerPan?: (deltaX: number, deltaY: number) => void
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void
  onRotate?: (angle: number, center: { x: number; y: number }) => void
}

interface TouchPoint {
  id: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  startTime: number
}

/**
 * GestureHandler - Handles multi-touch gestures
 * Supports pinch-to-zoom, two-finger pan, swipe, and rotation
 */
export class GestureHandler {
  private container: HTMLElement
  private callbacks: GestureCallbacks
  private gestureConfig: GestureConfig

  // Touch state
  private touches = new Map<number, TouchPoint>()
  private initialDistance = 0
  private initialAngle = 0
  private lastPinchScale = 1
  private lastRotateAngle = 0

  // Gesture state
  private isGesturing = false
  private gestureType: 'none' | 'pinch' | 'pan' | 'rotate' = 'none'

  constructor(
    container: HTMLElement,
    callbacks: GestureCallbacks = {},
    gestureConfig?: Partial<GestureConfig>
  ) {
    this.container = container
    this.callbacks = callbacks

    this.gestureConfig = {
      tapThreshold: 200,
      longPressThreshold: 500,
      swipeThreshold: 10,
      pinchSensitivity: 1.0,
      ...gestureConfig,
    }

    this.attachEventListeners()
  }

  /**
   * Handle touch start
   */
  private handleTouchStart = (event: TouchEvent): void => {
    const now = Date.now()

    // Update touch points
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i]
      this.touches.set(touch.identifier, {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: now,
      })
    }

    const touchCount = this.touches.size

    // Initialize multi-touch gestures
    if (touchCount === 2) {
      const points = Array.from(this.touches.values())
      this.initialDistance = this.getDistance(points[0], points[1])
      this.initialAngle = this.getAngle(points[0], points[1])
      this.lastPinchScale = 1
      this.lastRotateAngle = 0
      this.isGesturing = true
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault() // Prevent default scrolling

    // Update current positions
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i]
      const point = this.touches.get(touch.identifier)
      if (point) {
        point.currentX = touch.clientX
        point.currentY = touch.clientY
      }
    }

    const touchCount = this.touches.size

    // Handle two-finger gestures
    if (touchCount === 2) {
      const points = Array.from(this.touches.values())
      this.handleTwoFingerGesture(points[0], points[1])
    }
  }

  /**
   * Handle two-finger gestures (pinch zoom, pan, rotate)
   */
  private handleTwoFingerGesture(touch1: TouchPoint, touch2: TouchPoint): void {
    const currentDistance = this.getDistance(touch1, touch2)
    const currentAngle = this.getAngle(touch1, touch2)

    // Calculate gesture center
    const centerX = (touch1.currentX + touch2.currentX) / 2
    const centerY = (touch1.currentY + touch2.currentY) / 2

    // Detect pinch zoom
    if (this.initialDistance > 0) {
      const scale = currentDistance / this.initialDistance
      const deltaScale = scale - this.lastPinchScale

      // Only trigger if significant change
      if (Math.abs(deltaScale) > 0.01) {
        this.gestureType = 'pinch'
        this.callbacks.onPinchZoom?.(scale * this.gestureConfig.pinchSensitivity, {
          x: centerX,
          y: centerY,
        })
        this.lastPinchScale = scale
      }
    }

    // Detect rotation
    const angleDelta = currentAngle - this.initialAngle
    if (Math.abs(angleDelta - this.lastRotateAngle) > 0.05) {
      this.gestureType = 'rotate'
      this.callbacks.onRotate?.(angleDelta, { x: centerX, y: centerY })
      this.lastRotateAngle = angleDelta
    }

    // Detect two-finger pan (movement of center point)
    const centerStartX = (touch1.startX + touch2.startX) / 2
    const centerStartY = (touch1.startY + touch2.startY) / 2
    const deltaX = centerX - centerStartX
    const deltaY = centerY - centerStartY

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      this.gestureType = 'pan'
      this.callbacks.onTwoFingerPan?.(deltaX, deltaY)
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd = (event: TouchEvent): void => {
    // Remove ended touches
    const remainingTouchIds = new Set<number>()
    for (let i = 0; i < event.touches.length; i++) {
      remainingTouchIds.add(event.touches[i].identifier)
    }

    // Check for swipe gesture before removing touches
    if (this.touches.size === 1 && !this.isGesturing) {
      const touch = Array.from(this.touches.values())[0]
      this.detectSwipe(touch)
    }

    // Remove touches that ended
    const touchesToRemove: number[] = []
    this.touches.forEach((_, id) => {
      if (!remainingTouchIds.has(id)) {
        touchesToRemove.push(id)
      }
    })
    touchesToRemove.forEach(id => this.touches.delete(id))

    // Reset gesture state if no touches remain
    if (this.touches.size === 0) {
      this.isGesturing = false
      this.gestureType = 'none'
      this.initialDistance = 0
      this.initialAngle = 0
    }
  }

  /**
   * Detect swipe gesture
   */
  private detectSwipe(touch: TouchPoint): void {
    const deltaX = touch.currentX - touch.startX
    const deltaY = touch.currentY - touch.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const duration = Date.now() - touch.startTime

    // Check if movement is significant enough
    if (distance < this.gestureConfig.swipeThreshold * 3) return

    // Calculate velocity
    const velocity = distance / duration

    // Determine swipe direction
    let direction: 'left' | 'right' | 'up' | 'down'

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      direction = deltaY > 0 ? 'down' : 'up'
    }

    this.callbacks.onSwipe?.(direction, velocity)
  }

  /**
   * Calculate distance between two touch points
   */
  private getDistance(touch1: TouchPoint, touch2: TouchPoint): number {
    const dx = touch2.currentX - touch1.currentX
    const dy = touch2.currentY - touch1.currentY
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Calculate angle between two touch points
   */
  private getAngle(touch1: TouchPoint, touch2: TouchPoint): number {
    return Math.atan2(
      touch2.currentY - touch1.currentY,
      touch2.currentX - touch1.currentX
    )
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.container.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.container.addEventListener('touchend', this.handleTouchEnd, { passive: false })
    this.container.addEventListener('touchcancel', this.handleTouchEnd, { passive: false })
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners(): void {
    this.container.removeEventListener('touchstart', this.handleTouchStart)
    this.container.removeEventListener('touchmove', this.handleTouchMove)
    this.container.removeEventListener('touchend', this.handleTouchEnd)
    this.container.removeEventListener('touchcancel', this.handleTouchEnd)
  }

  /**
   * Update callbacks
   */
  setCallbacks(callbacks: GestureCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Get current gesture type
   */
  getGestureType(): 'none' | 'pinch' | 'pan' | 'rotate' {
    return this.gestureType
  }

  /**
   * Check if currently gesturing
   */
  isActive(): boolean {
    return this.isGesturing
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.detachEventListeners()
    this.touches.clear()
  }
}

export default GestureHandler

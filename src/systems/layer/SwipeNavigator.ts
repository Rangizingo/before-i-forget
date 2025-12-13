export interface SwipeNavigatorOptions {
  container: HTMLElement
  swipeThreshold?: number // Minimum distance to trigger swipe (px)
  velocityThreshold?: number // Minimum velocity to trigger swipe (px/ms)
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeProgress?: (progress: number, direction: 'up' | 'down') => void
  enabled?: boolean
}

interface TouchState {
  startY: number
  startTime: number
  currentY: number
  isTracking: boolean
}

/**
 * SwipeNavigator - Handles vertical swipe gestures for layer navigation
 * Swipe up: Active → All → Completed
 * Swipe down: Completed → All → Active
 */
export class SwipeNavigator {
  private container: HTMLElement
  private swipeThreshold: number
  private velocityThreshold: number
  private enabled: boolean

  private touchState: TouchState = {
    startY: 0,
    startTime: 0,
    currentY: 0,
    isTracking: false,
  }

  // Callbacks
  private onSwipeUp: (() => void) | null = null
  private onSwipeDown: (() => void) | null = null
  private onSwipeProgress: ((progress: number, direction: 'up' | 'down') => void) | null = null

  // Bound event handlers
  private boundHandleTouchStart: (e: TouchEvent) => void
  private boundHandleTouchMove: (e: TouchEvent) => void
  private boundHandleTouchEnd: (e: TouchEvent) => void
  private boundHandleWheel: (e: WheelEvent) => void

  constructor(options: SwipeNavigatorOptions) {
    this.container = options.container
    this.swipeThreshold = options.swipeThreshold ?? 50
    this.velocityThreshold = options.velocityThreshold ?? 0.3
    this.enabled = options.enabled ?? true

    this.onSwipeUp = options.onSwipeUp ?? null
    this.onSwipeDown = options.onSwipeDown ?? null
    this.onSwipeProgress = options.onSwipeProgress ?? null

    // Bind event handlers
    this.boundHandleTouchStart = this.handleTouchStart.bind(this)
    this.boundHandleTouchMove = this.handleTouchMove.bind(this)
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this)
    this.boundHandleWheel = this.handleWheel.bind(this)

    this.attachEventListeners()
  }

  /**
   * Enable/disable swipe navigation
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Update callbacks
   */
  setCallbacks(callbacks: {
    onSwipeUp?: () => void
    onSwipeDown?: () => void
    onSwipeProgress?: (progress: number, direction: 'up' | 'down') => void
  }): void {
    if (callbacks.onSwipeUp !== undefined) this.onSwipeUp = callbacks.onSwipeUp
    if (callbacks.onSwipeDown !== undefined) this.onSwipeDown = callbacks.onSwipeDown
    if (callbacks.onSwipeProgress !== undefined) this.onSwipeProgress = callbacks.onSwipeProgress
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    if (!this.enabled) return
    if (event.touches.length !== 1) return // Only single finger swipes

    const touch = event.touches[0]
    this.touchState = {
      startY: touch.clientY,
      startTime: Date.now(),
      currentY: touch.clientY,
      isTracking: true,
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.enabled || !this.touchState.isTracking) return
    if (event.touches.length !== 1) return

    const touch = event.touches[0]
    this.touchState.currentY = touch.clientY

    const deltaY = this.touchState.startY - this.touchState.currentY
    const direction = deltaY > 0 ? 'up' : 'down'
    const progress = Math.min(Math.abs(deltaY) / this.swipeThreshold, 1)

    // Only report progress if significant movement
    if (Math.abs(deltaY) > 10) {
      this.onSwipeProgress?.(progress, direction)
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(_event: TouchEvent): void {
    if (!this.enabled || !this.touchState.isTracking) return

    const deltaY = this.touchState.startY - this.touchState.currentY
    const deltaTime = Date.now() - this.touchState.startTime
    const velocity = Math.abs(deltaY) / deltaTime

    // Reset tracking
    this.touchState.isTracking = false

    // Check if swipe meets threshold
    const meetsDistanceThreshold = Math.abs(deltaY) >= this.swipeThreshold
    const meetsVelocityThreshold = velocity >= this.velocityThreshold

    if (meetsDistanceThreshold || meetsVelocityThreshold) {
      if (deltaY > 0) {
        // Swipe up (finger moved up) → go to next layer
        this.onSwipeUp?.()
      } else {
        // Swipe down (finger moved down) → go to previous layer
        this.onSwipeDown?.()
      }
    }

    // Reset progress
    this.onSwipeProgress?.(0, 'up')
  }

  /**
   * Handle mouse wheel for desktop navigation
   */
  private handleWheel(event: WheelEvent): void {
    if (!this.enabled) return

    // Debounce wheel events
    const now = Date.now()
    if ((this as any)._lastWheelTime && now - (this as any)._lastWheelTime < 500) {
      return
    }

    // Check for significant scroll
    if (Math.abs(event.deltaY) < 50) return

    (this as any)._lastWheelTime = now

    if (event.deltaY > 0) {
      // Scroll down → next layer
      this.onSwipeUp?.()
    } else {
      // Scroll up → previous layer
      this.onSwipeDown?.()
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    this.container.addEventListener('touchstart', this.boundHandleTouchStart, { passive: true })
    this.container.addEventListener('touchmove', this.boundHandleTouchMove, { passive: true })
    this.container.addEventListener('touchend', this.boundHandleTouchEnd, { passive: true })
    this.container.addEventListener('wheel', this.boundHandleWheel, { passive: true })
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners(): void {
    this.container.removeEventListener('touchstart', this.boundHandleTouchStart)
    this.container.removeEventListener('touchmove', this.boundHandleTouchMove)
    this.container.removeEventListener('touchend', this.boundHandleTouchEnd)
    this.container.removeEventListener('wheel', this.boundHandleWheel)
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.detachEventListeners()
    this.onSwipeUp = null
    this.onSwipeDown = null
    this.onSwipeProgress = null
  }
}

export default SwipeNavigator

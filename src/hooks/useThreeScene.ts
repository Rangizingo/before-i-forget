import { useEffect, useRef, useCallback, useState } from 'react'
import { SceneManager } from '@/systems/rendering'
import type {
  RenderConfig,
  CameraConfig,
  SceneConfig,
  PerformanceMetrics,
} from '@/types/neural'

interface UseThreeSceneOptions {
  renderConfig?: Partial<RenderConfig>
  cameraConfig?: Partial<CameraConfig>
  sceneConfig?: Partial<SceneConfig>
  autoStart?: boolean
}

interface UseThreeSceneReturn {
  containerRef: React.RefObject<HTMLDivElement>
  sceneManager: SceneManager | null
  isReady: boolean
  metrics: PerformanceMetrics | null
  start: () => void
  stop: () => void
}

/**
 * React hook for managing Three.js scene lifecycle
 * Handles initialization, cleanup, and provides scene access
 */
export function useThreeScene(options: UseThreeSceneOptions = {}): UseThreeSceneReturn {
  const {
    renderConfig,
    cameraConfig,
    sceneConfig,
    autoStart = true,
  } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  // Initialize scene manager
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create scene manager
    const manager = new SceneManager(
      container,
      renderConfig,
      cameraConfig,
      sceneConfig
    )
    sceneManagerRef.current = manager
    setSceneManager(manager)
    setIsReady(true)

    // Setup metrics tracking
    const metricsInterval = setInterval(() => {
      if (manager) {
        setMetrics(manager.getPerformanceMetrics())
      }
    }, 1000)

    // Auto-start if enabled
    if (autoStart) {
      manager.start()
    }

    // Cleanup on unmount
    return () => {
      clearInterval(metricsInterval)
      manager.dispose()
      sceneManagerRef.current = null
      setSceneManager(null)
      setIsReady(false)
    }
  }, []) // Only run once on mount

  // Update configs if they change (rare)
  useEffect(() => {
    if (!sceneManagerRef.current || !sceneConfig?.backgroundColor) return
    sceneManagerRef.current.setBackgroundColor(sceneConfig.backgroundColor)
  }, [sceneConfig?.backgroundColor])

  const start = useCallback(() => {
    sceneManagerRef.current?.start()
  }, [])

  const stop = useCallback(() => {
    sceneManagerRef.current?.stop()
  }, [])

  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    sceneManager,
    isReady,
    metrics,
    start,
    stop,
  }
}

export default useThreeScene

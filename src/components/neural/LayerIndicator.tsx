import { useEffect, useState, useRef } from 'react'
import type { LayerType } from '@/types/neural'

interface LayerIndicatorProps {
  currentLayer: LayerType
  layerIndex: number
  totalLayers: number
  isTransitioning?: boolean
  autoHideDelay?: number // ms before auto-hide, 0 to disable
  className?: string
}

/**
 * LayerIndicator - Subtle display showing current layer
 * Features:
 * - Shows layer name with neural-themed styling
 * - Three dots indicating layer position
 * - Auto-fades after inactivity
 * - Glows during transitions
 */
export function LayerIndicator({
  currentLayer,
  layerIndex,
  totalLayers,
  isTransitioning = false,
  autoHideDelay = 3000,
  className = '',
}: LayerIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [opacity, setOpacity] = useState(1)
  const hideTimeoutRef = useRef<number | null>(null)

  // Layer display names
  const layerNames: Record<LayerType, string> = {
    active: 'Active',
    all: 'All Tasks',
    completed: 'Completed',
  }

  // Auto-hide logic
  useEffect(() => {
    // Clear existing timeout
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current)
    }

    // Show immediately
    setIsVisible(true)
    setOpacity(1)

    // Set auto-hide if enabled
    if (autoHideDelay > 0 && !isTransitioning) {
      hideTimeoutRef.current = window.setTimeout(() => {
        setOpacity(0.3)
      }, autoHideDelay)
    }

    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [currentLayer, autoHideDelay, isTransitioning])

  // Keep visible during transitions
  useEffect(() => {
    if (isTransitioning) {
      setOpacity(1)
    }
  }, [isTransitioning])

  if (!isVisible) return null

  return (
    <div
      className={`layer-indicator ${className}`}
      style={{
        opacity,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      {/* Layer name */}
      <div className={`layer-name ${isTransitioning ? 'transitioning' : ''}`}>
        {layerNames[currentLayer]}
      </div>

      {/* Layer dots */}
      <div className="layer-dots">
        {Array.from({ length: totalLayers }).map((_, index) => (
          <div
            key={index}
            className={`layer-dot ${index === layerIndex ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* Navigation hints */}
      <div className="layer-hints">
        {layerIndex > 0 && <span className="hint-up">↑</span>}
        {layerIndex < totalLayers - 1 && <span className="hint-down">↓</span>}
      </div>

      <style>{`
        .layer-indicator {
          position: fixed;
          left: 50%;
          bottom: 100px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          z-index: 20;
          pointer-events: none;
          user-select: none;
        }

        .layer-name {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(139, 92, 246, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.5rem 1rem;
          background: rgba(10, 10, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 2rem;
          transition: all 0.3s ease;
        }

        .layer-name.transitioning {
          color: rgba(139, 92, 246, 1);
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        }

        .layer-dots {
          display: flex;
          gap: 0.5rem;
        }

        .layer-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.4);
          transition: all 0.3s ease;
        }

        .layer-dot.active {
          background: rgba(139, 92, 246, 0.8);
          border-color: rgba(139, 92, 246, 1);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
          transform: scale(1.2);
        }

        .layer-hints {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: rgba(139, 92, 246, 0.4);
        }

        .hint-up, .hint-down {
          animation: pulse-hint 2s ease-in-out infinite;
        }

        .hint-down {
          animation-delay: 1s;
        }

        @keyframes pulse-hint {
          0%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          50% {
            opacity: 0.7;
            transform: translateY(-2px);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .layer-indicator {
            bottom: 80px;
          }

          .layer-name {
            font-size: 0.75rem;
            padding: 0.4rem 0.8rem;
          }

          .layer-dot {
            width: 6px;
            height: 6px;
          }
        }
      `}</style>
    </div>
  )
}

export default LayerIndicator

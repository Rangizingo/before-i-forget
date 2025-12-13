import React from 'react'
import { motion } from 'framer-motion'

export interface WebGLFallbackProps {
  onRetry?: () => void
}

/**
 * Checks if WebGL is supported
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return gl !== null && gl !== undefined
  } catch {
    return false
  }
}

/**
 * Gets WebGL error reason
 */
export function getWebGLErrorReason(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (!gl) {
      // Check if it's explicitly disabled
      if (canvas.getContext('2d')) {
        return 'WebGL is disabled in your browser. Check your browser settings or graphics drivers.'
      }
      return 'WebGL is not supported on this device.'
    }

    return 'Unknown WebGL error.'
  } catch (e) {
    return `WebGL initialization failed: ${e instanceof Error ? e.message : 'Unknown error'}`
  }
}

export const WebGLFallback: React.FC<WebGLFallbackProps> = ({ onRetry }) => {
  const errorReason = getWebGLErrorReason()

  return (
    <div className="webgl-fallback">
      <motion.div
        className="webgl-fallback__content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Neural-themed error illustration */}
        <div className="webgl-fallback__icon">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            {/* Broken neural connections */}
            <circle cx="60" cy="60" r="15" fill="#4C4567" opacity="0.5" />
            <circle cx="30" cy="40" r="8" fill="#4C4567" opacity="0.3" />
            <circle cx="90" cy="40" r="8" fill="#4C4567" opacity="0.3" />
            <circle cx="30" cy="80" r="8" fill="#4C4567" opacity="0.3" />
            <circle cx="90" cy="80" r="8" fill="#4C4567" opacity="0.3" />

            {/* Broken lines */}
            <path
              d="M38 45 L48 55"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M50 57 L52 59"
              stroke="#4C4567"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="2 4"
            />
            <path
              d="M72 55 L82 45"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M68 57 L70 55"
              stroke="#4C4567"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="2 4"
            />

            {/* Error X in center */}
            <path
              d="M52 52 L68 68 M68 52 L52 68"
              stroke="#EF4444"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className="webgl-fallback__title">
          3D Visualization Unavailable
        </h2>

        <p className="webgl-fallback__description">
          {errorReason}
        </p>

        <div className="webgl-fallback__tips">
          <h3>Try these fixes:</h3>
          <ul>
            <li>Update your graphics drivers</li>
            <li>Try a different browser (Chrome or Firefox recommended)</li>
            <li>Disable browser extensions that block WebGL</li>
            <li>Enable hardware acceleration in browser settings</li>
          </ul>
        </div>

        <div className="webgl-fallback__actions">
          {onRetry && (
            <button
              className="webgl-fallback__btn webgl-fallback__btn--primary"
              onClick={onRetry}
            >
              Try Again
            </button>
          )}
          <a
            href="https://get.webgl.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="webgl-fallback__btn webgl-fallback__btn--secondary"
          >
            Learn More
          </a>
        </div>

        {/* Simple 2D fallback visualization */}
        <div className="webgl-fallback__simple-view">
          <p className="webgl-fallback__simple-label">
            Using simplified view
          </p>
        </div>
      </motion.div>

      <style>{`
        .webgl-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 40px 20px;
          background: linear-gradient(135deg, #0F0A1F 0%, #1A1033 100%);
        }

        .webgl-fallback__content {
          text-align: center;
          max-width: 480px;
        }

        .webgl-fallback__icon {
          margin-bottom: 24px;
          animation: pulse-dim 3s ease-in-out infinite;
        }

        @keyframes pulse-dim {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        .webgl-fallback__title {
          font-size: 24px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 12px;
        }

        .webgl-fallback__description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 24px;
          line-height: 1.5;
        }

        .webgl-fallback__tips {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 24px;
          text-align: left;
        }

        .webgl-fallback__tips h3 {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 12px;
        }

        .webgl-fallback__tips ul {
          margin: 0;
          padding-left: 20px;
        }

        .webgl-fallback__tips li {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .webgl-fallback__tips li:last-child {
          margin-bottom: 0;
        }

        .webgl-fallback__actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 32px;
        }

        .webgl-fallback__btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .webgl-fallback__btn--primary {
          background: linear-gradient(135deg, #8B5CF6, #6366F1);
          border: none;
          color: #fff;
        }

        .webgl-fallback__btn--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .webgl-fallback__btn--secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
        }

        .webgl-fallback__btn--secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .webgl-fallback__simple-view {
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .webgl-fallback__simple-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }
      `}</style>
    </div>
  )
}

export default WebGLFallback

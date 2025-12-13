import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastData {
  id: string
  type: ToastType
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastProps extends ToastData {
  onDismiss: (id: string) => void
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
}

const toastColors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  info: {
    bg: 'rgba(99, 102, 241, 0.1)',
    border: 'rgba(99, 102, 241, 0.3)',
    icon: '#6366f1',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: '#22c55e',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: '#f59e0b',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '#ef4444',
  },
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  action,
  onDismiss,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onDismiss(id), duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onDismiss])

  const colors = toastColors[type]

  return (
    <motion.div
      className="toast"
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      style={{
        background: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div className="toast__icon" style={{ color: colors.icon }}>
        {toastIcons[type]}
      </div>
      <div className="toast__content">
        <p className="toast__message">{message}</p>
        {action && (
          <button className="toast__action" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
      <button
        className="toast__dismiss"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <style>{`
        .toast {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(15, 10, 31, 0.95);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          max-width: 400px;
          min-width: 280px;
        }

        .toast__icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }

        .toast__content {
          flex: 1;
        }

        .toast__message {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.4;
        }

        .toast__action {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 0;
          margin-top: 4px;
          text-decoration: underline;
          opacity: 0.8;
        }

        .toast__action:hover {
          opacity: 1;
        }

        .toast__dismiss {
          flex-shrink: 0;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .toast__dismiss:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Light mode */
        .light-mode .toast {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(0, 0, 0, 0.1);
        }

        .light-mode .toast__message {
          color: rgba(0, 0, 0, 0.9);
        }

        .light-mode .toast__dismiss {
          color: rgba(0, 0, 0, 0.4);
        }

        .light-mode .toast__dismiss:hover {
          color: rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </motion.div>
  )
}

// Toast Container Component
export interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = 'bottom-right',
}) => {
  const positionStyles: Record<typeof position, React.CSSProperties> = {
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
  }

  return (
    <div
      className="toast-container"
      style={positionStyles[position]}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>

      <style>{`
        .toast-container {
          position: fixed;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </div>
  )
}

// Toast Hook
let toastId = 0

interface ToastState {
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const toastListeners: Set<(toasts: ToastData[]) => void> = new Set()
let globalToasts: ToastData[] = []

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...globalToasts]))
}

export const toast = {
  show: (options: Omit<ToastData, 'id'>): string => {
    const id = `toast-${++toastId}`
    globalToasts.push({ ...options, id })
    notifyListeners()
    return id
  },
  info: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>): string => {
    return toast.show({ type: 'info', message, ...options })
  },
  success: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>): string => {
    return toast.show({ type: 'success', message, ...options })
  },
  warning: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>): string => {
    return toast.show({ type: 'warning', message, ...options })
  },
  error: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>): string => {
    return toast.show({ type: 'error', message, ...options })
  },
  dismiss: (id: string): void => {
    globalToasts = globalToasts.filter((t) => t.id !== id)
    notifyListeners()
  },
  clearAll: (): void => {
    globalToasts = []
    notifyListeners()
  },
}

export function useToast(): ToastState {
  const [toasts, setToasts] = useState<ToastData[]>(globalToasts)

  useEffect(() => {
    const listener = (newToasts: ToastData[]) => setToasts(newToasts)
    toastListeners.add(listener)
    return () => { toastListeners.delete(listener) }
  }, [])

  return {
    toasts,
    addToast: (toastData) => toast.show(toastData),
    removeToast: toast.dismiss,
    clearAll: toast.clearAll,
  }
}

export default Toast

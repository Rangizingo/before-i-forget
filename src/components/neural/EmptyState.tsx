import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface EmptyStateProps {
  onCreateFirst: (title: string) => void
  isAnimating?: boolean
}

const SEED_SUGGESTIONS = [
  "What's on your mind?",
  "Start a new project",
  "Remember to...",
  "Today's priority",
  "Idea to explore",
]

export const EmptyState: React.FC<EmptyStateProps> = ({
  onCreateFirst,
  isAnimating = false,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)

  const handleCreate = useCallback(() => {
    const title = inputValue.trim() || selectedSuggestion || "My first thought"
    onCreateFirst(title)
  }, [inputValue, selectedSuggestion, onCreateFirst])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSelectedSuggestion(suggestion)
    setInputValue(suggestion)
    setShowInput(true)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setSelectedSuggestion(null)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleCreate()
    }
  }, [inputValue, handleCreate])

  if (isAnimating) {
    return (
      <div className="empty-state empty-state--animating">
        <motion.div
          className="seed-animation"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 1],
            opacity: [0, 1, 1],
          }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="seed-neuron" />
          <div className="seed-glow" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Your neural network begins...
        </motion.p>
      </div>
    )
  }

  return (
    <div className="empty-state">
      <motion.div
        className="empty-state__content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Neural Icon */}
        <motion.div
          className="empty-state__icon"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
          >
            {/* Central neuron */}
            <circle
              cx="60"
              cy="60"
              r="20"
              fill="url(#neuronGradient)"
              opacity="0.8"
            />
            {/* Glow */}
            <circle
              cx="60"
              cy="60"
              r="30"
              fill="url(#glowGradient)"
              opacity="0.3"
            />
            {/* Dormant connection points */}
            <circle cx="30" cy="40" r="6" fill="#4C4567" opacity="0.4" />
            <circle cx="90" cy="40" r="6" fill="#4C4567" opacity="0.4" />
            <circle cx="30" cy="80" r="6" fill="#4C4567" opacity="0.4" />
            <circle cx="90" cy="80" r="6" fill="#4C4567" opacity="0.4" />
            {/* Dashed connection lines */}
            <path
              d="M40 60 L45 55"
              stroke="#6366F1"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.3"
            />
            <path
              d="M80 60 L75 55"
              stroke="#6366F1"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.3"
            />
            <defs>
              <radialGradient id="neuronGradient" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </radialGradient>
              <radialGradient id="glowGradient" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Title */}
        <h2 className="empty-state__title">
          Plant Your First Thought
        </h2>

        {/* Description */}
        <p className="empty-state__description">
          Every neural network starts with a single neuron.
          Create your first thought and watch your network grow.
        </p>

        {/* Input or Suggestions */}
        <AnimatePresence mode="wait">
          {showInput ? (
            <motion.div
              key="input"
              className="empty-state__input-wrapper"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="What's your first thought?"
                className="empty-state__input"
                autoFocus
              />
              <button
                onClick={handleCreate}
                className="empty-state__create-btn"
                disabled={!inputValue.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="suggestions"
              className="empty-state__suggestions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="empty-state__suggestion-label">Quick start:</p>
              <div className="empty-state__suggestion-chips">
                {SEED_SUGGESTIONS.map((suggestion, index) => (
                  <motion.button
                    key={suggestion}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(suggestion)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
              <button
                className="empty-state__custom-btn"
                onClick={() => setShowInput(true)}
              >
                Or type your own...
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          padding: 40px 20px;
        }

        .empty-state--animating {
          flex-direction: column;
          gap: 24px;
        }

        .seed-animation {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .seed-neuron {
          position: absolute;
          inset: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #A78BFA, #8B5CF6);
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
        }

        .seed-glow {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        .empty-state__content {
          text-align: center;
          max-width: 400px;
        }

        .empty-state__icon {
          margin-bottom: 24px;
        }

        .empty-state__title {
          font-size: 24px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 12px;
        }

        .empty-state__description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 32px;
          line-height: 1.5;
        }

        .empty-state__input-wrapper {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .empty-state__input {
          flex: 1;
          max-width: 250px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .empty-state__input:focus {
          border-color: rgba(139, 92, 246, 0.5);
          background: rgba(255, 255, 255, 0.08);
        }

        .empty-state__input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .empty-state__create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #8B5CF6, #6366F1);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .empty-state__create-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
        }

        .empty-state__create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state__suggestions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .empty-state__suggestion-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .empty-state__suggestion-chips {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }

        .suggestion-chip {
          padding: 8px 16px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-chip:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.4);
        }

        .empty-state__custom-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .empty-state__custom-btn:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Light mode styles */
        .light-mode .empty-state__title {
          color: #1F2937;
        }

        .light-mode .empty-state__description {
          color: rgba(0, 0, 0, 0.6);
        }

        .light-mode .empty-state__input {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.1);
          color: #1F2937;
        }

        .light-mode .empty-state__input::placeholder {
          color: rgba(0, 0, 0, 0.4);
        }

        .light-mode .suggestion-chip {
          background: rgba(139, 92, 246, 0.1);
          color: #4B5563;
        }

        .light-mode .empty-state__custom-btn {
          color: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  )
}

export default EmptyState

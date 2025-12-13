import { useState, useRef, useEffect, type KeyboardEvent, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { PrioritySelector, type Priority } from './PrioritySelector'
import type { TaskInput as TaskInputType } from '@/types'

interface TaskInputProps {
  onAdd: (input: TaskInputType) => Promise<void>
  autoFocus?: boolean
  placeholder?: string
}

export function TaskInput({ onAdd, autoFocus = true, placeholder = "What's on your mind?" }: TaskInputProps) {
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<Priority | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()

    const trimmedContent = content.trim()
    if (!trimmedContent || isSubmitting) return

    setIsSubmitting(true)
    try {
      const input: TaskInputType = {
        content: trimmedContent,
        priority
      }
      await onAdd(input)
      setContent('')
      setPriority(undefined)
    } catch (error) {
      console.error('Failed to add task:', error)
    } finally {
      setIsSubmitting(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-3"
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSubmitting}
          className="
            w-full px-4 py-3 pr-12 rounded-xl
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            border-2 border-slate-200 dark:border-slate-700
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:border-primary-500
            disabled:opacity-50
            transition-colors text-lg
          "
        />
        <motion.button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          whileTap={{ scale: 0.9 }}
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            p-2 rounded-lg
            bg-primary-600 text-white
            disabled:opacity-30 disabled:cursor-not-allowed
            hover:bg-primary-700
            transition-colors
          "
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">Priority:</span>
        <PrioritySelector value={priority} onChange={setPriority} size="sm" />
      </div>
    </motion.form>
  )
}

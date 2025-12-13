import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TagBadge } from './TagBadge'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  existingTags?: string[]
  placeholder?: string
}

export function TagInput({ tags, onChange, existingTags = [], placeholder = 'Add tags...' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter suggestions based on input and exclude already added tags
  const suggestions = existingTags
    .filter(tag =>
      !tags.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase().trim())
    )
    .slice(0, 5)

  useEffect(() => {
    if (inputValue.trim() && suggestions.length > 0) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [inputValue, suggestions.length])

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim()
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onChange([...tags, normalizedTag])
    }
    setInputValue('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmedValue = inputValue.trim()
      if (trimmedValue) {
        addTag(trimmedValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const handleBlur = () => {
    // Delay to allow clicking on suggestions
    setTimeout(() => {
      setShowSuggestions(false)
      // Add tag if there's input value on blur
      const trimmedValue = inputValue.trim()
      if (trimmedValue) {
        addTag(trimmedValue)
      }
    }, 200)
  }

  return (
    <div className="relative">
      <div className="
        flex flex-wrap items-center gap-1.5 p-2 rounded-lg
        bg-slate-50 dark:bg-slate-800/50
        border border-slate-200 dark:border-slate-700
        focus-within:border-primary-500 dark:focus-within:border-primary-500
        transition-colors
      ">
        <AnimatePresence mode="popLayout">
          {tags.map(tag => (
            <TagBadge
              key={tag}
              tag={tag}
              removable
              onRemove={removeTag}
            />
          ))}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (inputValue.trim() && suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="
            flex-1 min-w-[100px] px-1 py-1 text-sm
            bg-transparent
            text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none
          "
        />
      </div>

      {/* Autocomplete suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="
              absolute z-10 w-full mt-1 p-1
              bg-white dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              rounded-lg shadow-lg
            "
          >
            {suggestions.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="
                  w-full px-3 py-2 text-left text-sm rounded
                  text-slate-700 dark:text-slate-300
                  hover:bg-slate-100 dark:hover:bg-slate-700
                  transition-colors
                "
              >
                #{tag}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Press Enter or comma to add tags
      </p>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Timestamp } from 'firebase/firestore'

interface DatePickerProps {
  value?: Timestamp | null
  onChange: (date: Date | null) => void
  label?: string
  placeholder?: string
}

export function DatePicker({ value, onChange, label, placeholder = 'Set due date' }: DatePickerProps) {
  const [dateString, setDateString] = useState('')

  useEffect(() => {
    if (value) {
      const date = value.toDate()
      setDateString(date.toISOString().split('T')[0])
    } else {
      setDateString('')
    }
  }, [value])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateString = e.target.value
    setDateString(newDateString)

    if (newDateString) {
      const date = new Date(newDateString)
      onChange(date)
    } else {
      onChange(null)
    }
  }

  const handleClear = () => {
    setDateString('')
    onChange(null)
  }

  return (
    <div className="flex items-center gap-2">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      <div className="relative flex items-center gap-1">
        <input
          type="date"
          value={dateString}
          onChange={handleDateChange}
          placeholder={placeholder}
          className="
            px-3 py-1.5 rounded-lg
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            text-sm
            border border-slate-300 dark:border-slate-600
            focus:outline-none focus:ring-2 focus:ring-primary-500
            hover:border-slate-400 dark:hover:border-slate-500
            transition-colors
          "
        />

        <AnimatePresence>
          {dateString && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              type="button"
              className="
                p-1 rounded
                text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
                hover:bg-slate-100 dark:hover:bg-slate-700
                transition-colors
              "
              aria-label="Clear due date"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

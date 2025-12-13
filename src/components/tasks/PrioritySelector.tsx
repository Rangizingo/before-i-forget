import { motion } from 'framer-motion'

export type Priority = 'low' | 'medium' | 'high'

interface PrioritySelectorProps {
  value?: Priority
  onChange: (priority: Priority | undefined) => void
  size?: 'sm' | 'md'
}

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-red-500' }
]

export function PrioritySelector({ value, onChange, size = 'md' }: PrioritySelectorProps) {
  const buttonSize = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  const handlePriorityClick = (priority: Priority) => {
    if (value === priority) {
      onChange(undefined)
    } else {
      onChange(priority)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {priorities.map((priority) => {
        const isSelected = value === priority.value

        return (
          <motion.button
            key={priority.value}
            type="button"
            onClick={() => handlePriorityClick(priority.value)}
            whileTap={{ scale: 0.95 }}
            className={`
              ${buttonSize} rounded-lg font-medium
              flex items-center gap-1.5
              transition-all
              ${
                isSelected
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }
            `}
            aria-label={`Set priority to ${priority.label}`}
            aria-pressed={isSelected}
          >
            <span className={`${dotSize} rounded-full ${priority.color}`} />
            <span>{priority.label}</span>
          </motion.button>
        )
      })}

      {value && (
        <motion.button
          type="button"
          onClick={() => onChange(undefined)}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`
            ${buttonSize} rounded-lg
            text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition-colors
          `}
          aria-label="Clear priority"
        >
          Clear
        </motion.button>
      )}
    </div>
  )
}

export function getPriorityColor(priority?: Priority): string {
  if (!priority) return ''

  const priorityMap = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500'
  }

  return priorityMap[priority]
}

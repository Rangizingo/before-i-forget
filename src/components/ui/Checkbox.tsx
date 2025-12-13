import { forwardRef, type InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', checked, onChange, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <label
        htmlFor={checkboxId}
        className={`inline-flex items-center cursor-pointer ${className}`}
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <motion.div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              transition-colors
              ${checked
                ? 'bg-primary-600 border-primary-600'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
              }
            `}
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: checked ? 1 : 0,
                opacity: checked ? 1 : 0
              }}
              transition={{ duration: 0.15 }}
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
          </motion.div>
        </div>
        {label && (
          <span className="ml-2 text-slate-700 dark:text-slate-300">{label}</span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

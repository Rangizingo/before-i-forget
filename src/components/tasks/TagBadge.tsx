import { motion } from 'framer-motion'

interface TagBadgeProps {
  tag: string
  onClick?: (tag: string) => void
  onRemove?: (tag: string) => void
  clickable?: boolean
  removable?: boolean
}

export function TagBadge({ tag, onClick, onRemove, clickable = false, removable = false }: TagBadgeProps) {
  const handleClick = () => {
    if (clickable && onClick) {
      onClick(tag)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (removable && onRemove) {
      onRemove(tag)
    }
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
        bg-slate-200 dark:bg-slate-700
        text-slate-700 dark:text-slate-300
        ${clickable ? 'cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors' : ''}
        ${removable ? 'pr-1' : ''}
      `}
    >
      <span>#{tag}</span>
      {removable && (
        <button
          onClick={handleRemove}
          className="
            ml-0.5 p-0.5 rounded-full
            hover:bg-slate-300 dark:hover:bg-slate-500
            transition-colors
          "
          aria-label={`Remove tag ${tag}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.span>
  )
}

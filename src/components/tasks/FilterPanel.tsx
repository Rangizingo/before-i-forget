import { motion, AnimatePresence } from 'framer-motion'

export interface FilterState {
  status: 'all' | 'active' | 'completed'
  priorities: ('low' | 'medium' | 'high')[]
}

interface FilterPanelProps {
  isOpen: boolean
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}

export function FilterPanel({ isOpen, filters, onFilterChange }: FilterPanelProps) {
  const handleStatusChange = (status: FilterState['status']) => {
    onFilterChange({ ...filters, status })
  }

  const handlePriorityToggle = (priority: 'low' | 'medium' | 'high') => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority]
    onFilterChange({ ...filters, priorities: newPriorities })
  }

  const handleClearAll = () => {
    onFilterChange({ status: 'all', priorities: [] })
  }

  const hasActiveFilters = filters.status !== 'all' || filters.priorities.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
            {/* Status Filter */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </h3>
              <div className="flex gap-2">
                {(['all', 'active', 'completed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${
                        filters.status === status
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Priority
              </h3>
              <div className="space-y-2">
                {(['high', 'medium', 'low'] as const).map((priority) => (
                  <label
                    key={priority}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters.priorities.includes(priority)}
                      onChange={() => handlePriorityToggle(priority)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600
                        text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0
                        bg-white dark:bg-slate-700
                        cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                    <span
                      className={`ml-auto px-2 py-0.5 rounded text-xs font-medium
                        ${
                          priority === 'high'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : priority === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}
                    >
                      {priority}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear All Button */}
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <button
                  onClick={handleClearAll}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium
                    bg-slate-100 dark:bg-slate-700
                    text-slate-700 dark:text-slate-300
                    hover:bg-slate-200 dark:hover:bg-slate-600
                    transition-colors"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

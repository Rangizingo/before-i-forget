import { useCallback, useMemo, useState } from 'react'
import { Header, OfflineIndicator } from '@/components/layout'
import { TaskInput, TaskList, SearchBar, FilterPanel, type FilterState } from '@/components/tasks'
import { useTasks } from '@/hooks'
import type { TaskInput as TaskInputType, TaskUpdate } from '@/types'

export function HomePage() {
  const { tasks, loading, error, addTask, toggleComplete, deleteTask, updateTask } = useTasks()

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    priorities: []
  })
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const handleAddTask = useCallback(
    async (input: TaskInputType) => {
      await addTask(input)
    },
    [addTask]
  )

  const handleUpdateTask = useCallback(
    async (taskId: string, update: TaskUpdate) => {
      await updateTask(taskId, update)
    },
    [updateTask]
  )

  const handleTagClick = useCallback((tag: string) => {
    setSelectedTag(prevTag => prevTag === tag ? null : tag)
  }, [])

  // Filter tasks based on search query and filters
  const filteredTasks = useMemo(() => {
    let result = tasks

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((task) =>
        task.content.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (filters.status === 'active') {
      result = result.filter((task) => !task.completed)
    } else if (filters.status === 'completed') {
      result = result.filter((task) => task.completed)
    }

    // Apply priority filter
    if (filters.priorities.length > 0) {
      result = result.filter((task) =>
        task.priority ? filters.priorities.includes(task.priority) : false
      )
    }

    // Apply tag filter
    if (selectedTag) {
      result = result.filter((task) =>
        task.tags?.includes(selectedTag)
      )
    }

    return result
  }, [tasks, searchQuery, filters, selectedTag])

  const hasActiveFilters = searchQuery.trim() !== '' || filters.status !== 'all' || filters.priorities.length > 0 || selectedTag !== null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <OfflineIndicator />
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <TaskInput onAdd={handleAddTask} />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search tasks..."
              />
            </div>
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2
                ${
                  isFilterPanelOpen || hasActiveFilters
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              aria-label="Toggle filters"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="text-sm font-medium">Filters</span>
              {hasActiveFilters && !isFilterPanelOpen && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-white text-primary-500">
                  !
                </span>
              )}
            </button>
          </div>

          <FilterPanel
            isOpen={isFilterPanelOpen}
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>

        {/* Show empty state when filters return no results */}
        {!loading && filteredTasks.length === 0 && hasActiveFilters && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300 mb-2">
              No tasks match your filters
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Selected Tag Indicator */}
        {selectedTag && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Filtering by tag:
            </span>
            <span className="
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
              bg-primary-100 dark:bg-primary-900/30
              text-primary-700 dark:text-primary-300
              border border-primary-300 dark:border-primary-700
            ">
              #{selectedTag}
              <button
                onClick={() => setSelectedTag(null)}
                className="
                  p-0.5 rounded-full
                  hover:bg-primary-200 dark:hover:bg-primary-800
                  transition-colors
                "
                aria-label="Clear tag filter"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
        )}

        {/* Task List */}
        {(!hasActiveFilters || filteredTasks.length > 0) && (
          <TaskList
            tasks={filteredTasks}
            loading={loading}
            onToggle={toggleComplete}
            onDelete={deleteTask}
            onUpdate={handleUpdateTask}
            selectedTag={selectedTag}
            onTagClick={handleTagClick}
          />
        )}
      </main>
    </div>
  )
}

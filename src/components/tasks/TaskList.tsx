import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import type { Task, TaskUpdate } from '@/types'
import { TaskItem } from './TaskItem'
import { reorderTasks } from '@/services/tasks'

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  onToggle: (taskId: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  onUpdate: (taskId: string, update: TaskUpdate) => Promise<void>
  selectedTag?: string | null
  onTagClick?: (tag: string) => void
}

export function TaskList({ tasks, loading, onToggle, onDelete, onUpdate, selectedTag = null, onTagClick }: TaskListProps) {
  // Get all unique tags from all tasks
  const allTags = Array.from(new Set(tasks.flatMap(task => task.tags || [])))

  // Filter tasks by selected tag if one is selected
  const filteredTasks = selectedTag
    ? tasks.filter(task => task.tags?.includes(selectedTag))
    : tasks

  // Sort tasks: primary by sortOrder (manual), secondary by due date
  const sortTasks = (taskList: Task[]) => {
    return [...taskList].sort((a, b) => {
      // First, sort by sortOrder (existing manual order)
      const sortOrderDiff = b.sortOrder - a.sortOrder

      // If sortOrder is very close (within 1000ms), use due date as secondary sort
      if (Math.abs(sortOrderDiff) < 1000) {
        // Tasks with no due date go after tasks with due dates
        if (!a.dueDate && !b.dueDate) return sortOrderDiff
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        // Sort by due date (earliest first)
        return a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime()
      }

      return sortOrderDiff
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const activeTasksList = sortTasks(filteredTasks.filter((t) => !t.completed))
    const oldIndex = activeTasksList.findIndex((t) => t.id === active.id)
    const newIndex = activeTasksList.findIndex((t) => t.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Create new order
    const reorderedTasks = [...activeTasksList]
    const [movedTask] = reorderedTasks.splice(oldIndex, 1)
    reorderedTasks.splice(newIndex, 0, movedTask)

    // Persist to Firestore
    try {
      await reorderTasks(reorderedTasks.map((t) => t.id))
    } catch (error) {
      console.error('Failed to reorder tasks:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">✨</div>
        <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300 mb-2">
          All clear!
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Add a task above before you forget
        </p>
      </motion.div>
    )
  }

  const activeTasks = sortTasks(filteredTasks.filter((t) => !t.completed))
  const completedTasks = filteredTasks.filter((t) => t.completed)

  return (
    <div className="space-y-6">
      {activeTasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {activeTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    onTagClick={onTagClick}
                    existingTags={allTags}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 px-1">
            Completed ({completedTasks.length})
          </h3>
          <AnimatePresence mode="popLayout">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onTagClick={onTagClick}
                existingTags={allTags}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

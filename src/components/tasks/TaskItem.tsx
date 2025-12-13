import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, TaskUpdate } from '@/types'
import { Checkbox } from '@/components/ui'
import { getPriorityColor } from './PrioritySelector'
import { formatDate, isOverdue } from '@/utils'
import { TagBadge } from './TagBadge'
import { TagInput } from './TagInput'

interface TaskItemProps {
  task: Task
  onToggle: (taskId: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  onUpdate: (taskId: string, update: TaskUpdate) => Promise<void>
  onTagClick?: (tag: string) => void
  existingTags?: string[]
}

export function TaskItem({ task, onToggle, onDelete, onUpdate, onTagClick, existingTags = [] }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(task.content)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [editTags, setEditTags] = useState<string[]>(task.tags || [])
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    disabled: task.completed
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleToggle = async () => {
    try {
      await onToggle(task.id)
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(task.id)
    } catch (error) {
      console.error('Failed to delete task:', error)
      setIsDeleting(false)
    }
  }

  const handleStartEdit = () => {
    if (!task.completed) {
      setEditContent(task.content)
      setIsEditing(true)
    }
  }

  const handleSaveEdit = async () => {
    const trimmedContent = editContent.trim()
    if (trimmedContent && trimmedContent !== task.content) {
      try {
        await onUpdate(task.id, { content: trimmedContent })
      } catch (error) {
        console.error('Failed to update task:', error)
        setEditContent(task.content)
      }
    } else {
      setEditContent(task.content)
    }
    setIsEditing(false)
  }

  const handleTagsChange = (newTags: string[]) => {
    setEditTags(newTags)
  }

  const handleSaveTags = async () => {
    try {
      await onUpdate(task.id, { tags: editTags })
      setIsEditingTags(false)
    } catch (error) {
      console.error('Failed to update tags:', error)
      setEditTags(task.tags || [])
    }
  }

  const handleCancelTagsEdit = () => {
    setEditTags(task.tags || [])
    setIsEditingTags(false)
  }

  const handleCancelEdit = () => {
    setEditContent(task.content)
    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: isDeleting ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`
        group flex items-center gap-3 p-3 rounded-xl
        bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        hover:border-slate-300 dark:hover:border-slate-600
        transition-colors
        ${task.completed ? 'opacity-60' : ''}
        ${isDragging ? 'shadow-lg ring-2 ring-primary-500 z-50' : ''}
      `}
    >
      {!task.completed && (
        <button
          className="
            opacity-0 group-hover:opacity-100
            cursor-grab active:cursor-grabbing
            p-1 -ml-1
            text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
            transition-opacity
            touch-none
          "
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </button>
      )}

      {task.priority && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex-shrink-0"
          aria-label={`Priority: ${task.priority}`}
        >
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
        </motion.div>
      )}

      <Checkbox
        checked={task.completed}
        onChange={handleToggle}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      />

      <div className="flex-1 flex flex-col gap-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="
              px-2 py-1 rounded
              bg-slate-100 dark:bg-slate-700
              text-slate-900 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-primary-500
            "
          />
        ) : (
          <>
            <span
              onClick={handleStartEdit}
              className={`
                cursor-pointer
                text-slate-800 dark:text-slate-200
                ${task.completed ? 'line-through text-slate-500 dark:text-slate-400' : ''}
              `}
            >
              {task.content}
            </span>
            {task.dueDate && (
              <span
                className={`
                  text-xs flex items-center gap-1
                  ${!task.completed && isOverdue(task.dueDate.toDate())
                    ? 'text-red-500 dark:text-red-400 font-medium'
                    : 'text-slate-500 dark:text-slate-400'
                  }
                `}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(task.dueDate.toDate())}
              </span>
            )}

            {/* Tags display and editing */}
            {isEditingTags ? (
              <div className="mt-1">
                <TagInput
                  tags={editTags}
                  onChange={handleTagsChange}
                  existingTags={existingTags}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveTags}
                    className="text-xs px-2 py-1 rounded bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelTagsEdit}
                    className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                <AnimatePresence mode="popLayout">
                  {task.tags && task.tags.length > 0 && task.tags.map(tag => (
                    <TagBadge
                      key={tag}
                      tag={tag}
                      clickable={!!onTagClick}
                      onClick={onTagClick}
                    />
                  ))}
                </AnimatePresence>
                {!task.completed && (
                  <button
                    onClick={() => {
                      setEditTags(task.tags || [])
                      setIsEditingTags(true)
                    }}
                    className="
                      text-xs px-2 py-0.5 rounded-full
                      text-slate-500 dark:text-slate-400
                      hover:bg-slate-200 dark:hover:bg-slate-700
                      transition-colors opacity-0 group-hover:opacity-100
                    "
                  >
                    + tag
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <motion.button
        onClick={handleDelete}
        disabled={isDeleting}
        whileTap={{ scale: 0.9 }}
        className="
          opacity-0 group-hover:opacity-100
          p-1.5 rounded-lg
          text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
          transition-all
          disabled:cursor-not-allowed
        "
        aria-label="Delete task"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </motion.button>
    </motion.div>
  )
}

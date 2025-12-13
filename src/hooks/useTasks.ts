import { useState, useEffect, useCallback } from 'react'
import type { Task, TaskInput, TaskUpdate } from '@/types'
import {
  subscribeTasks,
  addTask as addTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
  toggleTaskComplete
} from '@/services'
import { useAuth } from './useAuth'

interface UseTasksReturn {
  tasks: Task[]
  loading: boolean
  error: string | null
  addTask: (input: TaskInput) => Promise<void>
  updateTask: (taskId: string, update: TaskUpdate) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  toggleComplete: (taskId: string) => Promise<void>
}

export function useTasks(): UseTasksReturn {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeTasks(
      user.uid,
      (newTasks) => {
        setTasks(newTasks)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user])

  const addTask = useCallback(
    async (input: TaskInput) => {
      if (!user) throw new Error('Must be logged in to add tasks')

      // Optimistic update
      const tempId = `temp-${Date.now()}`
      const optimisticTask: Task = {
        id: tempId,
        content: input.content,
        completed: false,
        priority: input.priority,
        tags: input.tags || [],
        sortOrder: Date.now(),
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Task['createdAt'],
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Task['updatedAt'],
        userId: user.uid
      }

      setTasks((prev) => [optimisticTask, ...prev])

      try {
        await addTaskService(user.uid, input)
      } catch (err) {
        // Revert optimistic update on error
        setTasks((prev) => prev.filter((t) => t.id !== tempId))
        throw err
      }
    },
    [user]
  )

  const updateTask = useCallback(async (taskId: string, update: TaskUpdate) => {
    // Optimistic update - filter out null values for type safety
    const safeUpdate = Object.fromEntries(
      Object.entries(update).filter(([, v]) => v !== null)
    )
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...safeUpdate } as Task : t))
    )

    try {
      await updateTaskService(taskId, update)
    } catch (err) {
      // Real-time listener will revert on error
      setError(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }, [])

  const deleteTask = useCallback(async (taskId: string) => {
    // Optimistic update
    const deletedTask = tasks.find((t) => t.id === taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))

    try {
      await deleteTaskService(taskId)
    } catch (err) {
      // Revert optimistic update on error
      if (deletedTask) {
        setTasks((prev) => [...prev, deletedTask])
      }
      throw err
    }
  }, [tasks])

  const toggleComplete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
      )

      try {
        await toggleTaskComplete(taskId, task.completed)
      } catch (err) {
        // Revert optimistic update on error
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, completed: task.completed } : t))
        )
        throw err
      }
    },
    [tasks]
  )

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete
  }
}

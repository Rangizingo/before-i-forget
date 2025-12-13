import { useEffect, useCallback, useRef } from 'react'
import type { Task, TaskInput, TaskUpdate } from '@/types'
import { useTasks } from './useTasks'
import type { NeuralNetwork } from '@/systems/procedural/NeuralNetwork'

interface UseNeuralTasksOptions {
  network: NeuralNetwork | null
  enabled?: boolean
}

interface UseNeuralTasksReturn {
  tasks: Task[]
  loading: boolean
  error: string | null
  addTask: (input: TaskInput) => Promise<void>
  updateTask: (taskId: string, update: TaskUpdate) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  toggleComplete: (taskId: string) => Promise<void>
  taskNeuronMap: Map<string, string> // taskId -> neuronId
  neuronTaskMap: Map<string, string> // neuronId -> taskId
}

/**
 * Bridge between Firebase tasks and NeuralNetwork
 * Automatically syncs tasks with neurons in the network
 */
export function useNeuralTasks({
  network,
  enabled = true
}: UseNeuralTasksOptions): UseNeuralTasksReturn {
  const taskHook = useTasks()

  // Maintain bidirectional mapping between tasks and neurons
  const taskNeuronMapRef = useRef<Map<string, string>>(new Map())
  const neuronTaskMapRef = useRef<Map<string, string>>(new Map())

  // Track previous tasks to detect changes
  const prevTasksRef = useRef<Task[]>([])

  /**
   * Sync tasks with neurons when tasks change
   */
  useEffect(() => {
    if (!network || !enabled || taskHook.loading) {
      return
    }

    const prevTasks = prevTasksRef.current
    const currentTasks = taskHook.tasks

    // Find new tasks (task added)
    const newTasks = currentTasks.filter(
      (task) => !prevTasks.find((t) => t.id === task.id)
    )

    // Find deleted tasks
    const deletedTasks = prevTasks.filter(
      (task) => !currentTasks.find((t) => t.id === task.id)
    )

    // Find updated tasks (completion status changed)
    const updatedTasks = currentTasks.filter((task) => {
      const prevTask = prevTasks.find((t) => t.id === task.id)
      return prevTask && prevTask.completed !== task.completed
    })

    // Handle new tasks - create neurons
    newTasks.forEach((task) => {
      // Skip if this task already has a neuron
      if (taskNeuronMapRef.current.has(task.id)) {
        return
      }

      try {
        const neuronData = network.addTaskNeuron(task.id)

        // Update mappings
        taskNeuronMapRef.current.set(task.id, neuronData.id)
        neuronTaskMapRef.current.set(neuronData.id, task.id)

        // Pulse the new neuron for visual feedback
        network.pulseNeuron(neuronData.id, 1.0, false)
      } catch (error) {
        console.error('Error adding task neuron:', error)
      }
    })

    // Handle deleted tasks - delete neurons
    deletedTasks.forEach((task) => {
      const neuronId = taskNeuronMapRef.current.get(task.id)
      if (neuronId) {
        try {
          network.deleteNeuron(neuronId)

          // Update mappings
          taskNeuronMapRef.current.delete(task.id)
          neuronTaskMapRef.current.delete(neuronId)
        } catch (error) {
          console.error('Error deleting task neuron:', error)
        }
      }
    })

    // Handle updated tasks - mark neurons as complete
    updatedTasks.forEach((task) => {
      const neuronId = taskNeuronMapRef.current.get(task.id)
      if (neuronId) {
        try {
          if (task.completed) {
            network.completeNeuron(neuronId)
          } else {
            // Task was un-completed - pulse the neuron to reactivate it
            network.pulseNeuron(neuronId, 1.0, true)
          }
        } catch (error) {
          console.error('Error updating task neuron:', error)
        }
      }
    })

    // Update previous tasks reference
    prevTasksRef.current = currentTasks
  }, [taskHook.tasks, taskHook.loading, network, enabled])

  /**
   * Initialize neurons from existing tasks when network is first loaded
   */
  useEffect(() => {
    if (!network || !enabled || taskHook.loading || prevTasksRef.current.length > 0) {
      return
    }

    // Create neurons for all existing tasks
    taskHook.tasks.forEach((task) => {
      // Skip if already has a neuron
      if (taskNeuronMapRef.current.has(task.id)) {
        return
      }

      try {
        const neuronData = network.addTaskNeuron(task.id)

        // Update mappings
        taskNeuronMapRef.current.set(task.id, neuronData.id)
        neuronTaskMapRef.current.set(neuronData.id, task.id)

        // If task is completed, mark neuron as completed
        if (task.completed) {
          network.completeNeuron(neuronData.id)
        }
      } catch (error) {
        console.error('Error initializing task neuron:', error)
      }
    })

    prevTasksRef.current = taskHook.tasks
  }, [network, enabled, taskHook.loading, taskHook.tasks])

  /**
   * Wrapped addTask that creates a neuron after task is added
   */
  const addTask = useCallback(
    async (input: TaskInput) => {
      await taskHook.addTask(input)
      // Neuron creation is handled by the effect that watches tasks
    },
    [taskHook]
  )

  /**
   * Wrapped updateTask
   */
  const updateTask = useCallback(
    async (taskId: string, update: TaskUpdate) => {
      await taskHook.updateTask(taskId, update)
      // Neuron update is handled by the effect that watches tasks
    },
    [taskHook]
  )

  /**
   * Wrapped deleteTask that deletes the neuron
   */
  const deleteTask = useCallback(
    async (taskId: string) => {
      await taskHook.deleteTask(taskId)
      // Neuron deletion is handled by the effect that watches tasks
    },
    [taskHook]
  )

  /**
   * Wrapped toggleComplete that updates the neuron state
   */
  const toggleComplete = useCallback(
    async (taskId: string) => {
      await taskHook.toggleComplete(taskId)
      // Neuron state update is handled by the effect that watches tasks
    },
    [taskHook]
  )

  return {
    tasks: taskHook.tasks,
    loading: taskHook.loading,
    error: taskHook.error,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    taskNeuronMap: taskNeuronMapRef.current,
    neuronTaskMap: neuronTaskMapRef.current
  }
}

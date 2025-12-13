import React, { useState } from 'react'
import type { Task } from '@/types'
import { useNeuralNetwork } from '@/contexts/NeuralNetworkContext'

interface NeuralTaskListProps {
  tasks: Task[]
  loading: boolean
  error: string | null
  onAddTask: (content: string) => Promise<void>
  onToggleComplete: (taskId: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  taskNeuronMap: Map<string, string>
}

export function NeuralTaskList({
  tasks,
  loading,
  error,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  taskNeuronMap
}: NeuralTaskListProps) {
  const { network } = useNeuralNetwork()
  const [newTaskContent, setNewTaskContent] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTaskContent.trim()) return

    setIsAdding(true)
    try {
      await onAddTask(newTaskContent.trim())
      setNewTaskContent('')
    } catch (err) {
      console.error('Error adding task:', err)
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleComplete = async (taskId: string) => {
    try {
      await onToggleComplete(taskId)
    } catch (err) {
      console.error('Error toggling task:', err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await onDeleteTask(taskId)
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }

  const handlePulseNeuron = (taskId: string) => {
    if (!network) return

    const neuronId = taskNeuronMap.get(taskId)
    if (neuronId) {
      network.pulseNeuron(neuronId, 1.0, true)
    }
  }

  if (loading) {
    return (
      <div className="neural-task-list">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="neural-task-list">
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleAddTask} className="task-input-form">
        <input
          type="text"
          value={newTaskContent}
          onChange={(e) => setNewTaskContent(e.target.value)}
          placeholder="What needs to be remembered?"
          className="task-input"
          disabled={isAdding}
        />
        <button type="submit" className="add-task-btn" disabled={isAdding || !newTaskContent.trim()}>
          {isAdding ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks yet. Add one to get started!</p>
          </div>
        ) : (
          <>
            <div className="task-section">
              <h3 className="section-title">Active Tasks ({tasks.filter(t => !t.completed).length})</h3>
              {tasks
                .filter((task) => !task.completed)
                .map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleComplete}
                    onDelete={handleDeleteTask}
                    onPulse={handlePulseNeuron}
                    hasNeuron={taskNeuronMap.has(task.id)}
                  />
                ))}
            </div>

            {tasks.filter((t) => t.completed).length > 0 && (
              <div className="task-section completed-section">
                <h3 className="section-title">Completed Tasks ({tasks.filter(t => t.completed).length})</h3>
                {tasks
                  .filter((task) => task.completed)
                  .map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      onPulse={handlePulseNeuron}
                      hasNeuron={taskNeuronMap.has(task.id)}
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
  onPulse: (taskId: string) => void
  hasNeuron: boolean
}

function TaskItem({ task, onToggle, onDelete, onPulse, hasNeuron }: TaskItemProps) {
  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="task-checkbox"
      />

      <div className="task-content" onClick={() => onToggle(task.id)}>
        <p className="task-text">{task.content}</p>
        {task.priority && (
          <span className={`priority-badge priority-${task.priority}`}>
            {task.priority}
          </span>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="task-tags">
            {task.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="task-actions">
        {hasNeuron && (
          <button
            onClick={() => onPulse(task.id)}
            className="pulse-btn"
            title="Pulse neuron"
          >
            ⚡
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="delete-btn"
          title="Delete task"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

import type { Timestamp } from 'firebase/firestore'

export interface Task {
  id: string
  content: string
  completed: boolean
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  dueDate?: Timestamp
  sortOrder: number
  createdAt: Timestamp
  updatedAt: Timestamp
  userId: string
}

export interface TaskInput {
  content: string
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  dueDate?: Date
}

export interface TaskUpdate {
  content?: string
  completed?: boolean
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  dueDate?: Timestamp | null
  sortOrder?: number
}

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from './firebase'
import type { Task, TaskInput, TaskUpdate } from '@/types'

const TASKS_COLLECTION = 'tasks'

export async function addTask(userId: string, input: TaskInput): Promise<string> {
  const taskData = {
    content: input.content,
    completed: false,
    priority: input.priority || null,
    tags: input.tags || [],
    dueDate: input.dueDate || null,
    sortOrder: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    userId
  }

  const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData)
  return docRef.id
}

export function subscribeTasks(
  userId: string,
  callback: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId),
    orderBy('sortOrder', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Task[]
      callback(tasks)
    },
    (error) => {
      console.error('Error fetching tasks:', error)
      onError?.(error)
    }
  )
}

export async function updateTask(taskId: string, update: TaskUpdate): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId)
  await updateDoc(taskRef, {
    ...update,
    updatedAt: serverTimestamp()
  })
}

export async function deleteTask(taskId: string): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId)
  await deleteDoc(taskRef)
}

export async function toggleTaskComplete(taskId: string, completed: boolean): Promise<void> {
  await updateTask(taskId, { completed: !completed })
}

export async function reorderTasks(taskIds: string[]): Promise<void> {
  const now = Date.now()
  const updates = taskIds.map((id, index) => {
    const taskRef = doc(db, TASKS_COLLECTION, id)
    return updateDoc(taskRef, {
      sortOrder: now - index,
      updatedAt: serverTimestamp()
    })
  })
  await Promise.all(updates)
}

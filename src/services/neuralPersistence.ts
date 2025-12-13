import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from './firebase'
import type { NetworkPersistence } from '@/types/neural'

const NEURAL_COLLECTION = 'neuralNetworks'

/**
 * Save neural network state to Firebase
 */
export async function saveNetworkState(
  userId: string,
  networkData: NetworkPersistence
): Promise<void> {
  const docRef = doc(db, NEURAL_COLLECTION, userId)

  await setDoc(docRef, {
    ...networkData,
    updatedAt: serverTimestamp()
  })
}

/**
 * Load neural network state from Firebase
 */
export async function loadNetworkState(
  userId: string
): Promise<NetworkPersistence | null> {
  const docRef = doc(db, NEURAL_COLLECTION, userId)
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  return {
    seed: data.seed,
    neurons: data.neurons,
    lastSyncAt: data.lastSyncAt
  }
}

/**
 * Subscribe to real-time neural network state changes
 */
export function subscribeNetworkState(
  userId: string,
  callback: (data: NetworkPersistence | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, NEURAL_COLLECTION, userId)

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null)
        return
      }

      const data = snapshot.data()
      callback({
        seed: data.seed,
        neurons: data.neurons,
        lastSyncAt: data.lastSyncAt
      })
    },
    (error) => {
      console.error('Error subscribing to network state:', error)
      onError?.(error)
    }
  )
}

/**
 * Save network state to localStorage for offline support
 */
export function saveNetworkStateLocal(
  userId: string,
  networkData: NetworkPersistence
): void {
  const key = `neural_network_${userId}`
  localStorage.setItem(key, JSON.stringify(networkData))
}

/**
 * Load network state from localStorage
 */
export function loadNetworkStateLocal(
  userId: string
): NetworkPersistence | null {
  const key = `neural_network_${userId}`
  const data = localStorage.getItem(key)

  if (!data) {
    return null
  }

  try {
    return JSON.parse(data)
  } catch (error) {
    console.error('Error parsing local network state:', error)
    return null
  }
}

/**
 * Clear network state from localStorage
 */
export function clearNetworkStateLocal(userId: string): void {
  const key = `neural_network_${userId}`
  localStorage.removeItem(key)
}

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { NeuralNetwork } from '@/systems/procedural/NeuralNetwork'
import { useAuth } from '@/hooks/useAuth'
import {
  saveNetworkState,
  loadNetworkState,
  saveNetworkStateLocal,
  loadNetworkStateLocal,
  subscribeNetworkState
} from '@/services/neuralPersistence'

interface NeuralNetworkContextValue {
  network: NeuralNetwork | null
  loading: boolean
  error: string | null
  saveState: () => Promise<void>
  resetNetwork: (seed?: number) => void
}

const NeuralNetworkContext = createContext<NeuralNetworkContextValue | undefined>(
  undefined
)

interface NeuralNetworkProviderProps {
  children: React.ReactNode
  enablePhysics?: boolean
  autoSave?: boolean
  autoSaveInterval?: number // milliseconds
}

export function NeuralNetworkProvider({
  children,
  enablePhysics = true,
  autoSave = true,
  autoSaveInterval = 30000 // 30 seconds
}: NeuralNetworkProviderProps) {
  const { user } = useAuth()
  const [network, setNetwork] = useState<NeuralNetwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const autoSaveTimerRef = useRef<number | null>(null)
  const lastSaveRef = useRef<number>(0)
  const isInitializedRef = useRef(false)

  /**
   * Save network state to Firebase and localStorage
   */
  const saveState = useCallback(async () => {
    if (!network || !user) return

    try {
      const networkData = network.serialize()

      // Save to Firebase
      await saveNetworkState(user.uid, networkData)

      // Save to localStorage for offline support
      saveNetworkStateLocal(user.uid, networkData)

      lastSaveRef.current = Date.now()
    } catch (err) {
      console.error('Error saving network state:', err)
      setError(err instanceof Error ? err.message : 'Failed to save network state')
    }
  }, [network, user])

  /**
   * Load network state from Firebase or localStorage
   */
  const loadState = useCallback(async () => {
    if (!user) return null

    try {
      // Try loading from Firebase first
      let networkData = await loadNetworkState(user.uid)

      // If not found in Firebase, try localStorage
      if (!networkData) {
        networkData = loadNetworkStateLocal(user.uid)
      }

      return networkData
    } catch (err) {
      console.error('Error loading network state:', err)

      // Fallback to localStorage on error
      try {
        return loadNetworkStateLocal(user.uid)
      } catch (localErr) {
        console.error('Error loading from localStorage:', localErr)
        return null
      }
    }
  }, [user])

  /**
   * Reset network to initial state
   */
  const resetNetwork = useCallback(
    (seed?: number) => {
      if (!network) return

      network.reset(seed)
      setError(null)

      // Save the reset state
      if (autoSave) {
        saveState()
      }
    },
    [network, autoSave, saveState]
  )

  /**
   * Initialize network when user logs in
   */
  useEffect(() => {
    if (!user) {
      setNetwork(null)
      setLoading(false)
      isInitializedRef.current = false
      return
    }

    // Prevent re-initialization
    if (isInitializedRef.current) {
      return
    }

    const initializeNetwork = async () => {
      setLoading(true)
      setError(null)

      try {
        // Load persisted network state
        const persistedData = await loadState()

        let newNetwork: NeuralNetwork

        if (persistedData) {
          // Restore from persisted state
          newNetwork = new NeuralNetwork(persistedData.seed, enablePhysics)
          newNetwork.deserialize(persistedData)
        } else {
          // Create new network
          newNetwork = new NeuralNetwork(undefined, enablePhysics)
        }

        setNetwork(newNetwork)
        isInitializedRef.current = true
      } catch (err) {
        console.error('Error initializing network:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize network')

        // Create a new network as fallback
        const fallbackNetwork = new NeuralNetwork(undefined, enablePhysics)
        setNetwork(fallbackNetwork)
        isInitializedRef.current = true
      } finally {
        setLoading(false)
      }
    }

    initializeNetwork()
  }, [user, enablePhysics, loadState])

  /**
   * Subscribe to real-time network state changes (for multi-device sync)
   */
  useEffect(() => {
    if (!user || !network) return

    const unsubscribe = subscribeNetworkState(
      user.uid,
      (data) => {
        if (!data) return

        // Only update if the remote data is newer
        if (data.lastSyncAt > lastSaveRef.current) {
          try {
            network.deserialize(data)
          } catch (err) {
            console.error('Error deserializing network state:', err)
          }
        }
      },
      (err) => {
        console.error('Error subscribing to network state:', err)
      }
    )

    return unsubscribe
  }, [user, network])

  /**
   * Auto-save network state periodically
   */
  useEffect(() => {
    if (!autoSave || !network || !user) {
      return
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
    }

    // Set up auto-save timer
    autoSaveTimerRef.current = setInterval(() => {
      saveState()
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [autoSave, network, user, autoSaveInterval, saveState])

  /**
   * Save state before user leaves
   */
  useEffect(() => {
    if (!network || !user) return

    const handleBeforeUnload = () => {
      // Use synchronous localStorage save for reliability
      const networkData = network.serialize()
      saveNetworkStateLocal(user.uid, networkData)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [network, user])

  const value: NeuralNetworkContextValue = {
    network,
    loading,
    error,
    saveState,
    resetNetwork
  }

  return (
    <NeuralNetworkContext.Provider value={value}>
      {children}
    </NeuralNetworkContext.Provider>
  )
}

/**
 * Hook to access the neural network context
 */
export function useNeuralNetwork(): NeuralNetworkContextValue {
  const context = useContext(NeuralNetworkContext)

  if (context === undefined) {
    throw new Error('useNeuralNetwork must be used within a NeuralNetworkProvider')
  }

  return context
}

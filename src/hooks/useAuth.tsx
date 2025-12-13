import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { AuthContextType, AuthUser } from '@/types'
import { mapFirebaseUser } from '@/types'
import {
  signInWithGoogle as signInWithGoogleService,
  sendMagicLink as sendMagicLinkService,
  verifyMagicLink as verifyMagicLinkService,
  signOut as signOutService,
  subscribeToAuthChanges
} from '@/services'

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser))
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      await signInWithGoogleService()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMagicLink = useCallback(async (email: string) => {
    try {
      setError(null)
      setLoading(true)
      await sendMagicLinkService(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyMagicLink = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      await verifyMagicLinkService()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify magic link')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setError(null)
      await signOutService()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out')
      throw err
    }
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    sendMagicLink,
    verifyMagicLink,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

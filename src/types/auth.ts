import type { User } from 'firebase/auth'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  verifyMagicLink: () => Promise<void>
  signOut: () => Promise<void>
}

export function mapFirebaseUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL
  }
}

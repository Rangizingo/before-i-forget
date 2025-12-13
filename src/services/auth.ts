import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

const actionCodeSettings = {
  url: window.location.origin + '/auth/verify',
  handleCodeInApp: true
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function sendMagicLink(email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings)
  window.localStorage.setItem('emailForSignIn', email)
}

export async function verifyMagicLink(): Promise<User | null> {
  if (!isSignInWithEmailLink(auth, window.location.href)) {
    return null
  }

  let email = window.localStorage.getItem('emailForSignIn')
  if (!email) {
    email = window.prompt('Please provide your email for confirmation')
  }

  if (!email) {
    throw new Error('Email is required to complete sign-in')
  }

  const result = await signInWithEmailLink(auth, email, window.location.href)
  window.localStorage.removeItem('emailForSignIn')
  return result.user
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

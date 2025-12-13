import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks'
import { Button, Input } from '@/components/ui'

export function LoginPage() {
  const { user, loading, error, signInWithGoogle, sendMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Google sign-in failed:', err)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      await sendMagicLink(email)
      setMagicLinkSent(true)
    } catch (err) {
      console.error('Failed to send magic link:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">🧠</span>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Before I Forget
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Quick capture for busy minds
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {magicLinkSent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Check your email
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <Button variant="ghost" onClick={() => setMagicLinkSent(false)}>
                Use a different email
              </Button>
            </motion.div>
          ) : (
            <>
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                loading={loading}
                variant="secondary"
                className="w-full mb-4"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">
                    or
                  </span>
                </div>
              </div>

              <form onSubmit={handleMagicLink}>
                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  disabled={!email.trim() || isSubmitting}
                  loading={isSubmitting}
                  className="w-full mt-4"
                >
                  Send magic link
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

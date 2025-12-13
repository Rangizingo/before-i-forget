import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks'

export function MagicLinkVerifyPage() {
  const navigate = useNavigate()
  const { verifyMagicLink, error } = useAuth()
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyMagicLink()
        navigate('/', { replace: true })
      } catch (err) {
        console.error('Magic link verification failed:', err)
        setVerifying(false)
      }
    }

    verify()
  }, [verifyMagicLink, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {verifying ? (
          <>
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Verifying your email...
            </h1>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Verification failed
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {error || 'The magic link may have expired or already been used.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Back to login
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

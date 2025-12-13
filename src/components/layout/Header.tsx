import { motion } from 'framer-motion'
import { useAuth } from '@/hooks'
import { Button } from '@/components/ui'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        flex items-center justify-between
        px-4 py-3
        bg-white/80 dark:bg-slate-900/80
        backdrop-blur-sm
        border-b border-slate-200 dark:border-slate-800
        sticky top-0 z-10
      "
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">🧠</span>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Before I Forget
        </h1>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
              {user.email?.[0].toUpperCase()}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      )}
    </motion.header>
  )
}

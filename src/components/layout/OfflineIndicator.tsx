import { motion, AnimatePresence } from 'framer-motion'
import { useOnlineStatus } from '@/hooks'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="
            fixed top-0 left-0 right-0
            bg-amber-500 text-amber-900
            text-center py-2 text-sm font-medium
            z-50
          "
        >
          You're offline. Changes will sync when you're back online.
        </motion.div>
      )}
    </AnimatePresence>
  )
}

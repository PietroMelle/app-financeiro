import { AnimatePresence, motion } from 'motion/react'
import { useLocation, useOutlet } from 'react-router'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function AppShell() {
  const location = useLocation()
  const outlet = useOutlet()

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="lg:pl-64">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mx-auto w-full max-w-2xl px-4 pt-6 pb-32 lg:px-8 lg:pt-10 lg:pb-12"
          >
            {outlet}
          </motion.main>
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  )
}

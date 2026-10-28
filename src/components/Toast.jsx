import { CheckCircle2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

// Fica acima da barra inferior no celular. Não rouba o foco (aria-live polite).
export default function Toast({ message }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 lg:bottom-8"
    >
      <AnimatePresence>
        {message && (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
            className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

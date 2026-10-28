import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useLocation, useOutlet } from 'react-router'
import ToastProvider from '@/components/ToastProvider'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function AppShell() {
  const location = useLocation()
  const outlet = useOutlet()
  const main = useRef(null)
  const firstRender = useRef(true)

  // Ao trocar de tela, leva o foco ao conteúdo para o leitor de tela anunciar a página nova.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    main.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <ToastProvider>
      <div className="min-h-dvh">
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Pular para o conteúdo
        </a>
        <Sidebar />
        <div className="lg:pl-64">
          {/* Só entrada: saída com AnimatePresence travava a troca de rota (tela antiga presa em opacity 0). */}
          <motion.main
            id="conteudo"
            ref={main}
            tabIndex={-1}
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mx-auto w-full max-w-2xl px-4 pt-6 pb-32 outline-none lg:px-8 lg:pt-10 lg:pb-12"
          >
            {outlet}
          </motion.main>
        </div>
        <BottomNav />
      </div>
    </ToastProvider>
  )
}

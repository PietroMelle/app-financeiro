import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Toast from './Toast'
import { ToastContext } from './useToast'

const DURATION_MS = 4000

// Global para o aviso sobreviver à troca de tela (ex.: salvar e voltar para a lista).
export default function ToastProvider({ children }) {
  const [message, setMessage] = useState(null)
  const timer = useRef()

  const show = useCallback((text) => {
    clearTimeout(timer.current)
    setMessage({ text, id: Date.now() })
    timer.current = setTimeout(() => setMessage(null), DURATION_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast message={message} />
    </ToastContext.Provider>
  )
}

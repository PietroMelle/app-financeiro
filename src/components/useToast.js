import { useCallback, useEffect, useRef, useState } from 'react'

const DURATION_MS = 4000

export function useToast() {
  const [message, setMessage] = useState(null)
  const timer = useRef()

  const show = useCallback((text) => {
    clearTimeout(timer.current)
    setMessage({ text, id: Date.now() })
    timer.current = setTimeout(() => setMessage(null), DURATION_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return { message, show }
}

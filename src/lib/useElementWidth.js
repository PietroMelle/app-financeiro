import { useEffect, useRef, useState } from 'react'

// Largura de um elemento, atualizada quando ele muda de tamanho (gráficos em SVG medem o espaço real).
export function useElementWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}

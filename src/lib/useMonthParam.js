import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { addMonths, currentMonth, monthKey, parseMonthKey } from './dates'

// Mês selecionado vive na URL (?mes=2026-10) para links e voltar funcionarem.
export function useMonthParam() {
  const [params, setParams] = useSearchParams()
  const [direction, setDirection] = useState(0)
  const month = parseMonthKey(params.get('mes')) ?? currentMonth()

  function goToMonth(delta) {
    setDirection(delta)
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        next.set('mes', monthKey(addMonths(month, delta)))
        return next
      },
      { replace: true },
    )
  }

  return { month, direction, goToMonth }
}

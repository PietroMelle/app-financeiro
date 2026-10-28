import { useCallback, useEffect, useState } from 'react'
import { monthKey, monthRange } from '@/lib/dates'
import * as api from './api'

export function useTransactions({ year, month }) {
  const key = monthKey({ year, month })
  const [state, setState] = useState({ key: null, status: 'loading', transactions: [] })

  const fetchMonth = useCallback(
    () =>
      api.listTransactions(monthRange({ year, month })).then(
        (transactions) => setState({ key: monthKey({ year, month }), status: 'ready', transactions }),
        () => setState({ key: monthKey({ year, month }), status: 'error', transactions: [] }),
      ),
    [year, month],
  )

  useEffect(() => {
    fetchMonth()
  }, [fetchMonth])

  const reload = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }))
    return fetchMonth()
  }, [fetchMonth])

  // Enquanto o mês novo carrega, não mostra os dados do mês anterior.
  const current = state.key === key
  return { status: current ? state.status : 'loading', transactions: current ? state.transactions : [], reload }
}

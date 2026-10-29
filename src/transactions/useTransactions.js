import { useCallback, useEffect, useState } from 'react'
import { monthKey, monthRange } from '@/lib/dates'
import * as api from './api'

// Lançamentos de um período (Relatórios). Ao trocar o período, mantém os dados antigos
// na tela até chegarem os novos (sem piscar o carregando).
export function useTransactionsBetween(from, to) {
  const [state, setState] = useState({ key: null, status: 'loading', transactions: [] })
  const key = `${from}|${to}`

  useEffect(() => {
    let current = true
    api.listTransactions({ from, to }).then(
      (transactions) => current && setState({ key: `${from}|${to}`, status: 'ready', transactions }),
      () => current && setState((s) => ({ ...s, key: `${from}|${to}`, status: 'error' })),
    )
    return () => {
      current = false
    }
  }, [from, to])

  return { status: state.key === null ? 'loading' : state.status, stale: state.key !== key, transactions: state.transactions }
}

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
  // refresh busca de novo sem voltar ao estado de carregando (os valores animam para os novos).
  return { status: current ? state.status : 'loading', transactions: current ? state.transactions : [], reload, refresh: fetchMonth }
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as transactionsApi from '@/transactions/api'
import * as api from './api'
import { savedByGoal } from './goalRules'

// Metas com o total guardado em cada uma (todos os meses).
export function useGoals() {
  const [state, setState] = useState({ status: 'loading', goals: [], savings: [] })

  const fetchAll = useCallback(
    () =>
      Promise.all([api.listGoals(), transactionsApi.listSavings()]).then(
        ([goals, savings]) => setState({ status: 'ready', goals, savings }),
        () => setState((s) => ({ ...s, status: 'error' })),
      ),
    [],
  )

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const create = useCallback(async (input) => {
    const created = await api.createGoal(input)
    setState((s) => ({ ...s, goals: [...s.goals, created] }))
  }, [])

  const update = useCallback(async (id, input) => {
    const updated = await api.updateGoal(id, input)
    setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? updated : g)) }))
  }, [])

  const remove = useCallback(async (id) => {
    await api.deleteGoal(id)
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id), savings: s.savings.filter((t) => t.goalId !== id) }))
  }, [])

  const save = useCallback(async (goal, { amountCents, date }) => {
    const created = await transactionsApi.createTransaction({
      kind: 'saving',
      amountCents,
      date,
      description: '',
      categoryId: null,
      goalId: goal.id,
    })
    setState((s) => ({ ...s, savings: [...s.savings, created] }))
  }, [])

  const saved = useMemo(() => savedByGoal(state.savings), [state.savings])

  return {
    status: state.status,
    goals: state.goals,
    saved,
    reload: fetchAll,
    create,
    update,
    remove,
    save,
  }
}

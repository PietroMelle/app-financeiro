import { useCallback, useEffect, useMemo, useState } from 'react'
import { colorSlots } from '@/categories/categoryLook'
import * as api from './api'
import { defaultAccount } from './accountRules'

// Contas com o saldo atual de cada uma (Q51). refresh busca de novo sem voltar ao carregando.
export function useAccounts() {
  const [state, setState] = useState({ status: 'loading', accounts: [], balances: new Map() })

  const fetchAll = useCallback(
    () =>
      Promise.all([api.listAccounts(), api.listBalances()]).then(
        ([accounts, balances]) => setState({ status: 'ready', accounts, balances }),
        () => setState((s) => ({ ...s, status: 'error' })),
      ),
    [],
  )

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const create = useCallback(async (input) => {
    await api.createAccount(input)
    await fetchAll()
  }, [fetchAll])

  const update = useCallback(async (id, input) => {
    await api.updateAccount(id, input)
    await fetchAll()
  }, [fetchAll])

  const remove = useCallback(async (id) => {
    await api.deleteAccount(id)
    await fetchAll()
  }, [fetchAll])

  const makeDefault = useCallback(async (id) => {
    await api.makeDefault(id)
    await fetchAll()
  }, [fetchAll])

  // slot = cor da conta: a escolhida ou a automática pela ordem, como nas categorias.
  const accounts = useMemo(() => {
    const slots = colorSlots(state.accounts)
    return state.accounts.map((a) => ({ ...a, slot: a.color ?? slots.get(a.id) }))
  }, [state.accounts])

  return {
    status: state.status,
    accounts,
    balances: state.balances,
    defaultAccount: defaultAccount(accounts),
    refresh: fetchAll,
    create,
    update,
    remove,
    makeDefault,
  }
}

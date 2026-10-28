import { useCallback, useEffect, useState } from 'react'
import * as api from './api'

export function useRecurrences() {
  const [recurrences, setRecurrences] = useState([])
  const [status, setStatus] = useState('loading')

  const fetchAll = useCallback(
    () =>
      api.listRecurrences().then(
        (data) => {
          setRecurrences(data)
          setStatus('ready')
        },
        () => setStatus('error'),
      ),
    [],
  )

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const create = useCallback(async (input) => {
    const created = await api.createRecurrence(input)
    setRecurrences((list) => [...list, created])
    return created
  }, [])

  const update = useCallback(async (id, input) => {
    const updated = await api.updateRecurrence(id, input)
    setRecurrences((list) => list.map((r) => (r.id === id ? updated : r)))
  }, [])

  const remove = useCallback(async (id) => {
    await api.deleteRecurrence(id)
    setRecurrences((list) => list.filter((r) => r.id !== id))
  }, [])

  return { recurrences, status, reload: fetchAll, create, update, remove }
}

import { useCallback, useEffect, useState } from 'react'
import * as api from './api'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')

  const fetchAll = useCallback(
    () =>
      api.listCategories().then(
        (data) => {
          setCategories(data)
          setStatus('ready')
        },
        () => setStatus('error'),
      ),
    [],
  )

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const reload = useCallback(() => {
    setStatus('loading')
    return fetchAll()
  }, [fetchAll])

  const create = useCallback(async (input) => {
    const created = await api.createCategory(input)
    setCategories((list) => [...list, created])
  }, [])

  const update = useCallback(async (id, changes) => {
    const updated = await api.updateCategory(id, changes)
    setCategories((list) => list.map((c) => (c.id === id ? updated : c)))
  }, [])

  const remove = useCallback(async (id) => {
    await api.deleteCategory(id)
    setCategories((list) => list.filter((c) => c.id !== id))
  }, [])

  return { categories, status, reload, create, update, remove }
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as api from './api'
import { colorSlots } from './categoryLook'

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

  // slot = cor da categoria (1 a 8), igual em todas as telas: a escolhida (Q46) ou a automática.
  const withSlots = useMemo(() => {
    const slots = colorSlots(categories)
    return categories.map((c) => ({ ...c, slot: c.color ?? slots.get(c.id) }))
  }, [categories])

  return { categories: withSlots, status, reload, create, update, remove }
}

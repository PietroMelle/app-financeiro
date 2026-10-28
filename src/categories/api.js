import { supabase } from '@/lib/supabase'
import { normalizeName } from './categoryRules'

const COLUMNS = 'id, name, kind, monthly_limit'

async function unwrap(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

export function listCategories() {
  return unwrap(supabase.from('categories').select(COLUMNS))
}

export function createCategory({ name, kind }) {
  return unwrap(
    supabase.from('categories').insert({ name: normalizeName(name), kind }).select(COLUMNS).single(),
  )
}

export function renameCategory(id, name) {
  return unwrap(
    supabase.from('categories').update({ name: normalizeName(name) }).eq('id', id).select(COLUMNS).single(),
  )
}

export function deleteCategory(id) {
  return unwrap(supabase.from('categories').delete().eq('id', id))
}

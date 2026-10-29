import { supabase } from '@/lib/supabase'
import { centsToDecimal, decimalToCents } from '@/lib/money'
import { normalizeName } from './categoryRules'

const COLUMNS = 'id, name, kind, monthly_limit, color, icon'

// color (1–8) e icon escolhidos pela pessoa (Q46); null = automático.
function toModel(row) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    limitCents: row.monthly_limit == null ? null : decimalToCents(row.monthly_limit),
    color: row.color,
    icon: row.icon,
  }
}

// limitCents 0 ou null = sem limite (Q15: limite só em despesas).
function limitToRow(limitCents) {
  return limitCents ? centsToDecimal(limitCents) : null
}

async function unwrap(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listCategories() {
  return (await unwrap(supabase.from('categories').select(COLUMNS))).map(toModel)
}

export async function createCategory({ name, kind, limitCents, color = null, icon = null }) {
  const row = {
    name: normalizeName(name),
    kind,
    monthly_limit: kind === 'expense' ? limitToRow(limitCents) : null,
    color,
    icon,
  }
  return toModel(await unwrap(supabase.from('categories').insert(row).select(COLUMNS).single()))
}

export async function updateCategory(id, { name, limitCents, color = null, icon = null }) {
  const row = { name: normalizeName(name), monthly_limit: limitToRow(limitCents), color, icon }
  return toModel(await unwrap(supabase.from('categories').update(row).eq('id', id).select(COLUMNS).single()))
}

export function deleteCategory(id) {
  return unwrap(supabase.from('categories').delete().eq('id', id))
}

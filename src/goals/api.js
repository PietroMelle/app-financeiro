import { supabase } from '@/lib/supabase'
import { centsToDecimal, decimalToCents } from '@/lib/money'

const COLUMNS = 'id, name, target_amount, deadline, created_at'

function toModel(row) {
  return {
    id: row.id,
    name: row.name,
    targetCents: decimalToCents(row.target_amount),
    deadline: row.deadline,
    created_at: row.created_at,
  }
}

function toRow({ name, targetCents, deadline }) {
  return { name: name.trim(), target_amount: centsToDecimal(targetCents), deadline: deadline ?? null }
}

async function unwrap(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listGoals() {
  const rows = await unwrap(supabase.from('goals').select(COLUMNS).order('created_at'))
  return rows.map(toModel)
}

export async function createGoal(input) {
  return toModel(await unwrap(supabase.from('goals').insert(toRow(input)).select(COLUMNS).single()))
}

export async function updateGoal(id, input) {
  return toModel(await unwrap(supabase.from('goals').update(toRow(input)).eq('id', id).select(COLUMNS).single()))
}

export function deleteGoal(id) {
  return unwrap(supabase.from('goals').delete().eq('id', id))
}

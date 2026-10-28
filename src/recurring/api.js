import { supabase } from '@/lib/supabase'
import { centsToDecimal, decimalToCents } from '@/lib/money'

const COLUMNS = 'id, kind, amount, category_id, description, day_of_month, starts_on, ends_on'

function toModel(row) {
  return {
    id: row.id,
    kind: row.kind,
    amountCents: decimalToCents(row.amount),
    categoryId: row.category_id,
    description: row.description,
    dayOfMonth: row.day_of_month,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
  }
}

function toRow({ kind, amountCents, categoryId, description, dayOfMonth, startsOn, endsOn }) {
  return {
    kind,
    amount: centsToDecimal(amountCents),
    category_id: categoryId,
    description: description.trim(),
    day_of_month: dayOfMonth,
    starts_on: startsOn,
    ends_on: endsOn ?? null,
  }
}

async function unwrap(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listRecurrences() {
  const rows = await unwrap(supabase.from('recurrences').select(COLUMNS).order('day_of_month').order('id'))
  return rows.map(toModel)
}

export async function createRecurrence(input) {
  return toModel(await unwrap(supabase.from('recurrences').insert(toRow(input)).select(COLUMNS).single()))
}

export async function updateRecurrence(id, input) {
  return toModel(await unwrap(supabase.from('recurrences').update(toRow(input)).eq('id', id).select(COLUMNS).single()))
}

export function deleteRecurrence(id) {
  return unwrap(supabase.from('recurrences').delete().eq('id', id))
}

import { supabase } from '@/lib/supabase'
import { centsToDecimal, decimalToCents } from '@/lib/money'

const COLUMNS = 'id, kind, amount, occurred_on, description, category_id, created_at'

function toModel(row) {
  return {
    id: row.id,
    kind: row.kind,
    amountCents: decimalToCents(row.amount),
    occurred_on: row.occurred_on,
    description: row.description ?? '',
    categoryId: row.category_id,
    created_at: row.created_at,
  }
}

function toRow({ kind, amountCents, date, description, categoryId }) {
  return {
    kind,
    amount: centsToDecimal(amountCents),
    occurred_on: date,
    description: description.trim() || null,
    category_id: categoryId,
  }
}

async function unwrap(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listTransactions({ from, to }) {
  const rows = await unwrap(
    supabase
      .from('transactions')
      .select(COLUMNS)
      .gte('occurred_on', from)
      .lte('occurred_on', to)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false }),
  )
  return rows.map(toModel)
}

// Histórico para sugerir categoria no lançamento rápido: os mais recentes com descrição e categoria.
export async function listRecentDescribed(limit = 300) {
  const rows = await unwrap(
    supabase
      .from('transactions')
      .select(COLUMNS)
      .not('description', 'is', null)
      .not('category_id', 'is', null)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit),
  )
  return rows.map(toModel)
}

export async function getTransaction(id) {
  return toModel(await unwrap(supabase.from('transactions').select(COLUMNS).eq('id', id).single()))
}

export async function createTransaction(input) {
  return toModel(await unwrap(supabase.from('transactions').insert(toRow(input)).select(COLUMNS).single()))
}

export async function updateTransaction(id, input) {
  return toModel(await unwrap(supabase.from('transactions').update(toRow(input)).eq('id', id).select(COLUMNS).single()))
}

export function deleteTransaction(id) {
  return unwrap(supabase.from('transactions').delete().eq('id', id))
}

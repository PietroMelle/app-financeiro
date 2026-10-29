import { supabase } from '@/lib/supabase'
import { centsToDecimal, decimalToCents } from '@/lib/money'

const COLUMNS = 'id, name, type, initial_balance, color, is_default, closing_day, due_day, credit_limit, created_at'

function toModel(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    initialCents: decimalToCents(row.initial_balance),
    color: row.color,
    isDefault: row.is_default,
    // Cartão (Q56)
    closingDay: row.closing_day,
    dueDay: row.due_day,
    limitCents: row.credit_limit == null ? null : decimalToCents(row.credit_limit),
    created_at: row.created_at,
  }
}

// Saldo inicial pode ser negativo (cheque especial).
const signedDecimal = (cents) => (cents < 0 ? `-${centsToDecimal(-cents)}` : centsToDecimal(cents))

function toRow({ name, type, initialCents, color, closingDay, dueDay, limitCents }) {
  const card = type === 'credit'
  return {
    name: name.trim(),
    type,
    initial_balance: signedDecimal(initialCents ?? 0),
    color: color ?? null,
    closing_day: card ? closingDay : null,
    due_day: card ? dueDay : null,
    credit_limit: card && limitCents ? centsToDecimal(limitCents) : null,
  }
}

async function unwrap(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listAccounts() {
  return (await unwrap(supabase.from('accounts').select(COLUMNS).order('id'))).map(toModel)
}

// Saldo atual (Q51), calculado no banco pela view account_balances.
export async function listBalances() {
  const rows = await unwrap(supabase.from('account_balances').select('account_id, balance'))
  return new Map(rows.map((r) => [r.account_id, decimalToCents(r.balance)]))
}

export async function createAccount(input) {
  return toModel(await unwrap(supabase.from('accounts').insert(toRow(input)).select(COLUMNS).single()))
}

export async function updateAccount(id, input) {
  return toModel(await unwrap(supabase.from('accounts').update(toRow(input)).eq('id', id).select(COLUMNS).single()))
}

// Só uma padrão por pessoa (índice único): desmarca a atual antes de marcar a nova.
export async function makeDefault(id) {
  await unwrap(supabase.from('accounts').update({ is_default: false }).eq('is_default', true))
  await unwrap(supabase.from('accounts').update({ is_default: true }).eq('id', id))
}

export function deleteAccount(id) {
  return unwrap(supabase.from('accounts').delete().eq('id', id))
}

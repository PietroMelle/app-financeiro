import { isGoalKind } from '@/categories/kinds'
import { supabase } from '@/lib/supabase'
import { centsToDecimal, decimalToCents } from '@/lib/money'

const COLUMNS =
  'id, kind, amount, occurred_on, description, category_id, recurrence_id, goal_id, account_id, to_account_id, ' +
  'installment_group, installment_number, installment_count, created_at'

function toModel(row) {
  return {
    id: row.id,
    kind: row.kind,
    amountCents: decimalToCents(row.amount),
    occurred_on: row.occurred_on,
    description: row.description ?? '',
    categoryId: row.category_id,
    recurrenceId: row.recurrence_id,
    goalId: row.goal_id,
    accountId: row.account_id,
    toAccountId: row.to_account_id,
    // Parcela de uma compra (Q60)
    installmentGroup: row.installment_group,
    installmentNumber: row.installment_number,
    installmentCount: row.installment_count,
    created_at: row.created_at,
  }
}

// recurrenceId só entra quando vem definido: editar um lançamento não desfaz a ligação.
// Regras do banco: guardado e resgate têm meta e nunca categoria nem conta (Q53);
// transferência tem origem e destino e nunca categoria (Q52); receita e despesa têm conta.
function toRow({
  kind,
  amountCents,
  date,
  description,
  categoryId,
  goalId,
  accountId,
  toAccountId,
  recurrenceId,
  installmentGroup,
  installmentNumber,
  installmentCount,
}) {
  const goal = isGoalKind(kind)
  const transfer = kind === 'transfer'
  return {
    kind,
    amount: centsToDecimal(amountCents),
    occurred_on: date,
    description: description.trim() || null,
    category_id: goal || transfer ? null : categoryId,
    goal_id: goal ? goalId : null,
    account_id: goal ? null : accountId,
    to_account_id: transfer ? toAccountId : null,
    ...(recurrenceId !== undefined && { recurrence_id: recurrenceId }),
    // Parcelas só são definidas ao criar a compra; editar uma parcela não as desfaz.
    ...(installmentGroup && {
      installment_group: installmentGroup,
      installment_number: installmentNumber,
      installment_count: installmentCount,
    }),
  }
}

// Todo o guardado e resgatado, de todos os meses: é o progresso das metas.
export async function listSavings() {
  const rows = await unwrap(supabase.from('transactions').select(COLUMNS).in('kind', ['saving', 'withdrawal']))
  return rows.map(toModel)
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

// Tudo o que passou por uma conta (cartão: compras e pagamentos), de todos os meses — base das faturas.
export async function listForAccount(accountId) {
  const rows = await unwrap(
    supabase
      .from('transactions')
      .select(COLUMNS)
      .or(`account_id.eq.${Number(accountId)},to_account_id.eq.${Number(accountId)}`)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false }),
  )
  return rows.map(toModel)
}

// Várias de uma vez (parcelas, Q60): ou entram todas, ou nenhuma.
export async function createTransactions(inputs) {
  return (await unwrap(supabase.from('transactions').insert(inputs.map(toRow)).select(COLUMNS))).map(toModel)
}

export function deleteInstallments(group) {
  return unwrap(supabase.from('transactions').delete().eq('installment_group', group))
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

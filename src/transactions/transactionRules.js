import { isGoalKind, isInflow } from '@/categories/kinds'

const MAX_DESCRIPTION = 200

const signed = (t) => (isInflow(t.kind) ? t.amountCents : -t.amountCents)

// Guardado (Q37) não é despesa, mas sai do saldo; o resgate (Q45) desfaz o guardado.
export function summarize(transactions) {
  let income = 0
  let expense = 0
  let saved = 0
  for (const t of transactions) {
    if (t.kind === 'income') income += t.amountCents
    else if (t.kind === 'saving') saved += t.amountCents
    else if (t.kind === 'withdrawal') saved -= t.amountCents
    else expense += t.amountCents
  }
  return { income, expense, saved, balance: income - expense - saved }
}

export function groupByDay(transactions) {
  const byDate = new Map()
  for (const t of transactions) {
    if (!byDate.has(t.occurred_on)) byDate.set(t.occurred_on, [])
    byDate.get(t.occurred_on).push(t)
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
      total: items.reduce((sum, t) => sum + signed(t), 0),
    }))
}

// Espelha as regras do banco: amount > 0, categoria do mesmo tipo (FK composta), descrição ≤ 200,
// guardado e resgate sempre com meta.
export function validateTransaction({ amountCents, kind, categoryId, goalId, date, description }, categories) {
  const errors = {}
  if (!amountCents || amountCents <= 0) errors.amount = 'Informe um valor.'
  if (!date) errors.date = 'Informe a data.'
  if (isGoalKind(kind) && goalId == null) errors.goal = 'Escolha a meta.'
  if (!isGoalKind(kind) && categoryId != null) {
    const category = categories.find((c) => c.id === categoryId)
    if (category && category.kind !== kind) {
      errors.category = `Escolha uma categoria de ${kind === 'income' ? 'receita' : 'despesa'}.`
    }
  }
  if (description && description.trim().length > MAX_DESCRIPTION) {
    errors.description = `Use no máximo ${MAX_DESCRIPTION} caracteres.`
  }
  return errors
}

export function transactionErrorMessage(error, action = 'salvar') {
  if (error?.code === '23503') return 'A categoria escolhida não existe mais. Escolha outra.'
  if (error?.code === '23514') return 'Confira o valor e a descrição.'
  if (error?.code === '23505') return 'Este previsto já foi confirmado neste mês.'
  if (error instanceof TypeError) return 'Sem conexão com o servidor. Verifique sua internet.'
  return `Não foi possível ${action}. Tente de novo.`
}

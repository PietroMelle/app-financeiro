import { sortByName } from '@/categories/categoryRules'

const WARNING_RATIO = 0.8

// Q20: verde até 80%, amarelo de 80% a 100%, vermelho acima do limite.
export function budgetLevel(spent, limit) {
  if (spent > limit) return 'over'
  if (spent >= limit * WARNING_RATIO) return 'warning'
  return 'ok'
}

export function buildBudget(categories, transactions) {
  const spentBy = new Map()
  for (const t of transactions) {
    if (t.kind !== 'expense') continue
    spentBy.set(t.categoryId, (spentBy.get(t.categoryId) ?? 0) + t.amountCents)
  }

  const expenseCategories = sortByName(categories.filter((c) => c.kind === 'expense'))

  const limited = expenseCategories
    .filter((c) => c.limitCents)
    .map((c) => {
      const spent = spentBy.get(c.id) ?? 0
      return {
        id: c.id,
        name: c.name,
        slot: c.slot,
        spent,
        limit: c.limitCents,
        remaining: c.limitCents - spent,
        ratio: spent / c.limitCents,
        level: budgetLevel(spent, c.limitCents),
      }
    })
    .sort((a, b) => b.ratio - a.ratio)

  const unlimited = expenseCategories
    .filter((c) => !c.limitCents && spentBy.get(c.id))
    .map((c) => ({ id: c.id, name: c.name, slot: c.slot, spent: spentBy.get(c.id) }))
  if (spentBy.get(null)) unlimited.push({ id: null, name: 'Sem categoria', spent: spentBy.get(null) })
  unlimited.sort((a, b) => b.spent - a.spent)

  return { limited, unlimited }
}

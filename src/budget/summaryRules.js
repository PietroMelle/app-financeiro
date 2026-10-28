export function greeting(now = new Date(), name = '') {
  const hour = now.getHours()
  const base = hour >= 5 && hour < 12 ? 'Bom dia' : hour >= 12 && hour < 18 ? 'Boa tarde' : 'Boa noite'
  const first = name.trim().split(/\s+/)[0]
  return first ? `${base}, ${first}` : base
}

// O que sobra no mês para gastar. "Guardado" (metas, Q37) sai do disponível sem contar como despesa.
export function availableToSpend({ income, expense, saved = 0 }) {
  return income - expense - saved
}

export function latest(transactions, count) {
  return [...transactions]
    .sort((a, b) => {
      if (a.occurred_on !== b.occurred_on) return a.occurred_on < b.occurred_on ? 1 : -1
      return a.created_at < b.created_at ? 1 : -1
    })
    .slice(0, count)
}

import { addMonths, monthKey, monthOf } from '@/lib/dates'
import { summarize } from '@/transactions/transactionRules'

// Dados dos gráficos (spec Q38). Valores sempre em centavos.

const MAX_SLICES = 6

// Despesas por categoria, da maior para a menor. Rosca boa tem no máximo 6 fatias:
// passou disso, ficam as 5 maiores e o resto vira "Outras".
export function byCategory(transactions, categories) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const sums = new Map()
  for (const t of transactions) {
    if (t.kind !== 'expense') continue
    // Categoria desconhecida (apagada, ou lista ainda carregando) entra em "Sem categoria".
    const key = byId.has(t.categoryId) ? t.categoryId : null
    sums.set(key, (sums.get(key) ?? 0) + t.amountCents)
  }

  const total = [...sums.values()].reduce((s, c) => s + c, 0)
  let slices = [...sums.entries()]
    .map(([id, cents]) => {
      const category = byId.get(id)
      return { id: category ? id : null, name: category?.name ?? 'Sem categoria', slot: category?.slot, cents }
    })
    .sort((a, b) => b.cents - a.cents)

  if (slices.length > MAX_SLICES) {
    const kept = slices.slice(0, MAX_SLICES - 1)
    const rest = slices.slice(MAX_SLICES - 1).reduce((s, x) => s + x.cents, 0)
    slices = [...kept, { id: 'other', name: 'Outras', slot: undefined, cents: rest }]
  }

  return { total, slices: slices.map((s) => ({ ...s, share: total ? s.cents / total : 0 })) }
}

// Os últimos `count` meses até `endMonth`, do mais antigo ao mais novo.
export function monthlySeries(transactions, endMonth, count = 6) {
  const byMonth = new Map()
  for (const t of transactions) {
    const key = monthKey(monthOf(t.occurred_on))
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key).push(t)
  }
  return Array.from({ length: count }, (_, i) => {
    const month = addMonths(endMonth, i - count + 1)
    const key = monthKey(month)
    return { month, key, ...summarize(byMonth.get(key) ?? []) }
  })
}

// Marcas do eixo em números redondos (1, 2 ou 5 × potência de 10), cobrindo min..max.
export function niceTicks(min, max, target = 4) {
  const low = Math.min(min, 0)
  const high = Math.max(max, 0)
  const span = high - low || 10000
  const raw = span / target
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * power).find((s) => s >= raw)
  const start = Math.floor(low / step) * step
  const end = Math.max(Math.ceil(high / step) * step, start + step)
  const ticks = []
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v))
  return ticks
}

import { describe, expect, it } from 'vitest'
import { budgetLevel, buildBudget } from './budgetRules'

describe('budgetLevel (Q20)', () => {
  it('verde até 80%', () => {
    expect(budgetLevel(0, 1000)).toBe('ok')
    expect(budgetLevel(799, 1000)).toBe('ok')
  })

  it('amarelo de 80% a 100%', () => {
    expect(budgetLevel(800, 1000)).toBe('warning')
    expect(budgetLevel(1000, 1000)).toBe('warning')
  })

  it('vermelho ao passar do limite', () => {
    expect(budgetLevel(1001, 1000)).toBe('over')
  })
})

describe('buildBudget', () => {
  const categories = [
    { id: 1, name: 'Mercado', kind: 'expense', limitCents: 80000 },
    { id: 2, name: 'Lazer', kind: 'expense', limitCents: 20000 },
    { id: 3, name: 'Transporte', kind: 'expense', limitCents: null },
    { id: 4, name: 'Saúde', kind: 'expense', limitCents: null },
    { id: 5, name: 'Salário', kind: 'income', limitCents: null },
  ]
  const tx = (categoryId, kind, amountCents) => ({ categoryId, kind, amountCents })
  const transactions = [
    tx(1, 'expense', 50000),
    tx(1, 'expense', 20000),
    tx(2, 'expense', 25000),
    tx(3, 'expense', 3000),
    tx(null, 'expense', 1000),
    tx(5, 'income', 500000),
  ]

  it('soma o gasto do mês por categoria com limite', () => {
    const { limited } = buildBudget(categories, transactions)
    const mercado = limited.find((r) => r.id === 1)
    expect(mercado).toMatchObject({ spent: 70000, limit: 80000, remaining: 10000, level: 'warning' })
    expect(mercado.ratio).toBeCloseTo(0.875)
  })

  it('ordena do mais apertado para o mais folgado', () => {
    const { limited } = buildBudget(categories, transactions)
    expect(limited.map((r) => r.name)).toEqual(['Lazer', 'Mercado'])
    expect(limited[0]).toMatchObject({ level: 'over', remaining: -5000 })
  })

  it('mostra limites mesmo sem gasto no mês', () => {
    const { limited } = buildBudget(categories, [])
    expect(limited.map((r) => r.spent)).toEqual([0, 0])
  })

  it('lista gastos sem limite, maior primeiro, incluindo "Sem categoria"', () => {
    const { unlimited } = buildBudget(categories, transactions)
    expect(unlimited).toEqual([
      { id: 3, name: 'Transporte', spent: 3000 },
      { id: null, name: 'Sem categoria', spent: 1000 },
    ])
  })

  it('ignora receitas', () => {
    const { limited, unlimited } = buildBudget(categories, transactions)
    expect([...limited, ...unlimited].some((r) => r.id === 5)).toBe(false)
  })
})

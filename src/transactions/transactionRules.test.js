import { describe, expect, it } from 'vitest'
import { groupByDay, summarize, validateTransaction } from './transactionRules'

const tx = (id, occurred_on, kind, amountCents, created_at = '2026-10-01T10:00:00Z') => ({
  id,
  occurred_on,
  kind,
  amountCents,
  created_at,
})

describe('summarize', () => {
  it('soma receitas, despesas e saldo em centavos', () => {
    const list = [tx(1, '2026-10-01', 'income', 500000), tx(2, '2026-10-02', 'expense', 1250), tx(3, '2026-10-03', 'expense', 29)]
    expect(summarize(list)).toEqual({ income: 500000, expense: 1279, balance: 498721 })
  })

  it('lista vazia zera tudo', () => {
    expect(summarize([])).toEqual({ income: 0, expense: 0, balance: 0 })
  })
})

describe('groupByDay', () => {
  it('agrupa por data, dias mais recentes primeiro', () => {
    const list = [tx(1, '2026-10-01', 'expense', 100), tx(2, '2026-10-03', 'expense', 200), tx(3, '2026-10-01', 'income', 50)]
    const groups = groupByDay(list)
    expect(groups.map((g) => g.date)).toEqual(['2026-10-03', '2026-10-01'])
    expect(groups[1].items.map((t) => t.id).sort()).toEqual([1, 3])
  })

  it('no mesmo dia, o lançado por último vem primeiro', () => {
    const list = [tx(1, '2026-10-01', 'expense', 100, '2026-10-01T08:00:00Z'), tx(2, '2026-10-01', 'expense', 100, '2026-10-01T09:00:00Z')]
    expect(groupByDay(list)[0].items.map((t) => t.id)).toEqual([2, 1])
  })

  it('traz o saldo do dia', () => {
    const list = [tx(1, '2026-10-01', 'expense', 300), tx(2, '2026-10-01', 'income', 1000)]
    expect(groupByDay(list)[0].total).toBe(700)
  })
})

describe('validateTransaction', () => {
  const valid = { amountCents: 1250, kind: 'expense', categoryId: 1, date: '2026-10-28', description: 'Pão' }
  const categories = [
    { id: 1, kind: 'expense' },
    { id: 2, kind: 'income' },
  ]

  it('aceita lançamento válido, inclusive sem categoria', () => {
    expect(validateTransaction(valid, categories)).toEqual({})
    expect(validateTransaction({ ...valid, categoryId: null }, categories)).toEqual({})
  })

  it('exige valor maior que zero', () => {
    expect(validateTransaction({ ...valid, amountCents: 0 }, categories).amount).toBe('Informe um valor.')
  })

  it('exige data', () => {
    expect(validateTransaction({ ...valid, date: '' }, categories).date).toBe('Informe a data.')
  })

  it('recusa categoria de outro tipo', () => {
    expect(validateTransaction({ ...valid, categoryId: 2 }, categories).category).toBe(
      'Escolha uma categoria de despesa.',
    )
  })

  it('limita a descrição a 200 caracteres', () => {
    expect(validateTransaction({ ...valid, description: 'a'.repeat(201) }, categories).description).toBe(
      'Use no máximo 200 caracteres.',
    )
  })
})

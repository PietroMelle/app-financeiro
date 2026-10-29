import { describe, expect, it } from 'vitest'
import { byCategory, monthlySeries, niceTicks } from './reportRules'

const cat = (id, name, slot, kind = 'expense') => ({ id, name, slot, kind })
const tx = (kind, amountCents, categoryId = null, occurred_on = '2026-10-10') => ({ kind, amountCents, categoryId, occurred_on })

describe('byCategory', () => {
  const categories = [cat(1, 'Mercado', 1), cat(2, 'Moradia', 2), cat(3, 'Lazer', 3), cat(9, 'Salário', 8, 'income')]

  it('soma as despesas por categoria, da maior para a menor, com a parte de cada uma', () => {
    const result = byCategory([tx('expense', 3000, 1), tx('expense', 1000, 3), tx('expense', 6000, 2), tx('income', 99999, 9)], categories)
    expect(result.total).toBe(10000)
    expect(result.slices.map((s) => [s.name, s.cents, s.share])).toEqual([
      ['Moradia', 6000, 0.6],
      ['Mercado', 3000, 0.3],
      ['Lazer', 1000, 0.1],
    ])
    expect(result.slices[0].slot).toBe(2)
  })

  it('não conta guardado nem receita', () => {
    expect(byCategory([tx('saving', 500), tx('income', 500, 9)], categories)).toEqual({ total: 0, slices: [] })
  })

  it('lançamento sem categoria vira a fatia "Sem categoria", sem cor de categoria', () => {
    const { slices } = byCategory([tx('expense', 100)], categories)
    expect(slices).toEqual([{ id: null, name: 'Sem categoria', slot: undefined, cents: 100, share: 1 }])
  })

  it('categoria desconhecida soma em uma única fatia "Sem categoria"', () => {
    const { slices } = byCategory([tx('expense', 100, 77), tx('expense', 50, 88), tx('expense', 25)], categories)
    expect(slices).toEqual([{ id: null, name: 'Sem categoria', slot: undefined, cents: 175, share: 1 }])
  })

  it('passa de 6 fatias: mantém as 5 maiores e junta o resto em "Outras"', () => {
    const many = Array.from({ length: 8 }, (_, i) => cat(i + 1, `C${i + 1}`, i + 1))
    const list = many.map((c, i) => tx('expense', (8 - i) * 100, c.id))
    const { slices, total } = byCategory(list, many)
    expect(slices).toHaveLength(6)
    expect(slices.at(-1)).toMatchObject({ id: 'other', name: 'Outras', cents: 300 + 200 + 100 })
    expect(slices.reduce((s, x) => s + x.cents, 0)).toBe(total)
  })

  it('com exatamente 6 categorias, não agrupa', () => {
    const six = Array.from({ length: 6 }, (_, i) => cat(i + 1, `C${i + 1}`, i + 1))
    const { slices } = byCategory(six.map((c) => tx('expense', 100, c.id)), six)
    expect(slices.some((s) => s.id === 'other')).toBe(false)
  })
})

describe('monthlySeries', () => {
  it('monta os últimos meses, do mais antigo ao atual, com zero onde não houve nada', () => {
    const list = [
      tx('income', 500000, null, '2026-10-05'),
      tx('expense', 120000, 1, '2026-10-08'),
      tx('saving', 30000, null, '2026-10-09'),
      tx('expense', 9000, 1, '2026-08-20'),
    ]
    const series = monthlySeries(list, { year: 2026, month: 10 }, 3)
    expect(series.map((m) => m.key)).toEqual(['2026-08', '2026-09', '2026-10'])
    expect(series[0]).toMatchObject({ income: 0, expense: 9000, saved: 0, balance: -9000 })
    expect(series[1]).toMatchObject({ income: 0, expense: 0, saved: 0, balance: 0 })
    expect(series[2]).toMatchObject({ income: 500000, expense: 120000, saved: 30000, balance: 350000 })
  })

  it('atravessa a virada do ano', () => {
    expect(monthlySeries([], { year: 2027, month: 2 }, 4).map((m) => m.key)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
  })
})

describe('niceTicks', () => {
  it('arredonda o topo para um número limpo', () => {
    expect(niceTicks(0, 523000)).toEqual([0, 200000, 400000, 600000])
    expect(niceTicks(0, 87000)).toEqual([0, 50000, 100000])
  })

  it('inclui valores negativos quando há saldo negativo', () => {
    expect(niceTicks(-150000, 380000)).toEqual([-200000, 0, 200000, 400000])
  })

  it('sem dados, mostra uma escala mínima', () => {
    expect(niceTicks(0, 0)).toEqual([0, 5000])
  })
})

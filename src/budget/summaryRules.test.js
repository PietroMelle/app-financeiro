import { describe, expect, it } from 'vitest'
import { availableToSpend, greeting, latest } from './summaryRules'

describe('greeting (Q32)', () => {
  const at = (h) => new Date(2026, 9, 28, h, 0)

  it('muda com o horário', () => {
    expect(greeting(at(6))).toBe('Bom dia')
    expect(greeting(at(12))).toBe('Boa tarde')
    expect(greeting(at(18))).toBe('Boa noite')
    expect(greeting(at(2))).toBe('Boa noite')
  })

  it('acrescenta o primeiro nome quando existe', () => {
    expect(greeting(at(13), '  Pietro Melle ')).toBe('Boa tarde, Pietro')
    expect(greeting(at(13), '')).toBe('Boa tarde')
  })
})

describe('availableToSpend', () => {
  it('é o que entrou menos o que saiu e o que foi guardado', () => {
    expect(availableToSpend({ income: 500000, expense: 17700 })).toBe(482300)
    expect(availableToSpend({ income: 500000, expense: 17700, saved: 20000 })).toBe(462300)
  })

  it('já desconta as despesas previstas (Q35), mas não conta receita prevista', () => {
    expect(availableToSpend({ income: 500000, expense: 17700, plannedExpense: 150000 })).toBe(332300)
  })

  it('pode ficar negativo', () => {
    expect(availableToSpend({ income: 0, expense: 1000 })).toBe(-1000)
  })
})

describe('latest', () => {
  it('traz os mais recentes, por data e depois por criação', () => {
    const list = [
      { id: 1, occurred_on: '2026-10-01', created_at: 'a' },
      { id: 2, occurred_on: '2026-10-05', created_at: 'a' },
      { id: 3, occurred_on: '2026-10-05', created_at: 'b' },
      { id: 4, occurred_on: '2026-10-03', created_at: 'a' },
    ]
    expect(latest(list, 3).map((t) => t.id)).toEqual([3, 2, 4])
  })
})

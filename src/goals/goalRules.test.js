import { describe, expect, it } from 'vitest'
import { goalProgress, goalStatus, savedByGoal, validateGoal } from './goalRules'

const TODAY = new Date(2026, 9, 28) // 28/10/2026

describe('savedByGoal', () => {
  it('soma só os guardados, por meta', () => {
    const transactions = [
      { kind: 'saving', goalId: 1, amountCents: 10000 },
      { kind: 'saving', goalId: 1, amountCents: 5000 },
      { kind: 'saving', goalId: 2, amountCents: 700 },
      { kind: 'expense', goalId: null, amountCents: 99999 },
    ]
    const saved = savedByGoal(transactions)
    expect(saved.get(1)).toBe(15000)
    expect(saved.get(2)).toBe(700)
    expect(saved.has(null)).toBe(false)
  })
})

describe('goalProgress', () => {
  const trip = { id: 1, name: 'Viagem', targetCents: 600000, deadline: '2027-03-31' }

  it('calcula quanto falta e a porcentagem', () => {
    const p = goalProgress(trip, 150000, TODAY)
    expect(p).toMatchObject({ saved: 150000, remaining: 450000, ratio: 0.25, reached: false })
  })

  it('sugere quanto guardar por mês até o prazo, contando este mês', () => {
    // out, nov, dez, jan, fev, mar = 6 meses
    const p = goalProgress(trip, 150000, TODAY)
    expect(p.monthsLeft).toBe(6)
    expect(p.perMonth).toBe(75000)
  })

  it('arredonda o valor por mês para cima, em centavos', () => {
    const p = goalProgress({ ...trip, targetCents: 100000, deadline: '2026-12-31' }, 0, TODAY)
    expect(p.perMonth).toBe(33334)
  })

  it('sem prazo, não sugere valor por mês', () => {
    const p = goalProgress({ ...trip, deadline: null }, 0, TODAY)
    expect(p.monthsLeft).toBeNull()
    expect(p.perMonth).toBeNull()
  })

  it('prazo vencido conta como atrasado', () => {
    const p = goalProgress({ ...trip, deadline: '2026-09-30' }, 0, TODAY)
    expect(p.overdue).toBe(true)
    expect(p.perMonth).toBeNull()
  })

  it('meta alcançada não fica atrasada nem passa de 100% na barra', () => {
    const p = goalProgress({ ...trip, deadline: '2026-09-30' }, 700000, TODAY)
    expect(p).toMatchObject({ reached: true, remaining: 0, overdue: false, perMonth: null })
    expect(p.ratio).toBe(1)
  })
})

describe('goalStatus', () => {
  const trip = { id: 1, name: 'Viagem', targetCents: 600000, deadline: '2027-03-31' }
  const status = (goal, saved) => goalStatus(goal, goalProgress(goal, saved, TODAY))

  it('diz quanto guardar por mês até o prazo', () => {
    expect(status(trip, 150000)).toEqual({
      type: 'pace',
      text: 'Faltam R$ 4.500,00 · guarde R$ 750,00 por mês até março de 2027',
    })
  })

  it('sem prazo, só quanto falta', () => {
    expect(status({ ...trip, deadline: null }, 0).type).toBe('left')
  })

  it('avisa prazo vencido e meta alcançada', () => {
    expect(status({ ...trip, deadline: '2026-09-30' }, 0).type).toBe('overdue')
    expect(status(trip, 600000)).toEqual({ type: 'reached', text: 'Meta alcançada' })
  })
})

describe('validateGoal', () => {
  const valid = { name: 'Viagem', targetCents: 600000, deadline: null }

  it('aceita uma meta completa', () => {
    expect(validateGoal(valid)).toEqual({})
  })

  it('exige nome e valor-alvo', () => {
    expect(Object.keys(validateGoal({ name: ' ', targetCents: 0 })).sort()).toEqual(['name', 'target'])
  })

  it('nome tem no máximo 60 caracteres', () => {
    expect(validateGoal({ ...valid, name: 'x'.repeat(61) }).name).toBeTruthy()
  })
})

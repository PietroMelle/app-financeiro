import { describe, expect, it } from 'vitest'
import { dueDate, endPlan, isActiveIn, plannedFor, summarizePlanned, validateRecurrence } from './recurringRules'

const OCT = { year: 2026, month: 10 }
const FEB = { year: 2027, month: 2 }

const netflix = {
  id: 1,
  kind: 'expense',
  amountCents: 5590,
  categoryId: 5,
  description: 'Netflix',
  dayOfMonth: 15,
  startsOn: '2026-09-10',
  endsOn: null,
}

describe('dueDate', () => {
  it('usa o dia do mês', () => {
    expect(dueDate(netflix, OCT)).toBe('2026-10-15')
  })

  it('dia 31 cai no último dia de meses curtos', () => {
    expect(dueDate({ ...netflix, dayOfMonth: 31 }, FEB)).toBe('2027-02-28')
    expect(dueDate({ ...netflix, dayOfMonth: 30 }, { year: 2028, month: 2 })).toBe('2028-02-29')
  })
})

describe('isActiveIn', () => {
  it('vale a partir do mês de início, mesmo com o dia já passado', () => {
    expect(isActiveIn(netflix, { year: 2026, month: 8 })).toBe(false)
    expect(isActiveIn(netflix, { year: 2026, month: 9 })).toBe(true)
    expect(isActiveIn(netflix, FEB)).toBe(true)
  })

  it('vale até o mês de término, inclusive', () => {
    const ending = { ...netflix, endsOn: '2026-10-01' }
    expect(isActiveIn(ending, OCT)).toBe(true)
    expect(isActiveIn(ending, { year: 2026, month: 11 })).toBe(false)
  })
})

describe('plannedFor', () => {
  it('lista as recorrentes do mês ainda não confirmadas', () => {
    const planned = plannedFor([netflix], [], OCT)
    expect(planned).toEqual([
      {
        recurrenceId: 1,
        kind: 'expense',
        amountCents: 5590,
        categoryId: 5,
        description: 'Netflix',
        date: '2026-10-15',
      },
    ])
  })

  it('some quando já existe confirmação no mês', () => {
    const confirmed = [{ id: 9, recurrenceId: 1, occurred_on: '2026-10-14' }]
    expect(plannedFor([netflix], confirmed, OCT)).toEqual([])
  })

  it('ignora confirmações de outro mês e de outra recorrente', () => {
    const others = [
      { id: 9, recurrenceId: 1, occurred_on: '2026-09-15' },
      { id: 10, recurrenceId: 2, occurred_on: '2026-10-15' },
    ]
    expect(plannedFor([netflix], others, OCT)).toHaveLength(1)
  })

  it('ignora recorrentes fora do período', () => {
    expect(plannedFor([{ ...netflix, startsOn: '2026-11-01' }], [], OCT)).toEqual([])
  })

  it('ordena por data', () => {
    const rent = { ...netflix, id: 2, description: 'Aluguel', dayOfMonth: 5 }
    expect(plannedFor([netflix, rent], [], OCT).map((p) => p.description)).toEqual(['Aluguel', 'Netflix'])
  })
})

describe('summarizePlanned', () => {
  it('soma receitas e despesas previstas', () => {
    const planned = [
      { kind: 'expense', amountCents: 5590 },
      { kind: 'expense', amountCents: 150000 },
      { kind: 'income', amountCents: 500000 },
    ]
    expect(summarizePlanned(planned)).toEqual({ income: 500000, expense: 155590 })
  })
})

describe('endPlan', () => {
  const today = new Date(2026, 9, 28)

  it('sem nenhuma confirmação, apaga a recorrente', () => {
    expect(endPlan({ ...netflix, startsOn: '2026-10-01' }, [], today)).toEqual({ action: 'delete' })
  })

  it('confirmada neste mês, termina neste mês', () => {
    const confirmed = [{ recurrenceId: 1, occurred_on: '2026-10-15' }]
    expect(endPlan(netflix, confirmed, today)).toEqual({ action: 'end', endsOn: '2026-10-28' })
  })

  it('pendente neste mês, termina no mês passado (some o previsto)', () => {
    const confirmed = [{ recurrenceId: 1, occurred_on: '2026-09-15' }]
    expect(endPlan(netflix, confirmed, today)).toEqual({ action: 'end', endsOn: '2026-09-30' })
  })

  it('começou neste mês e não foi confirmada: apaga mesmo com confirmações de outras', () => {
    const confirmed = [{ recurrenceId: 2, occurred_on: '2026-10-15' }]
    expect(endPlan({ ...netflix, startsOn: '2026-10-20' }, confirmed, today)).toEqual({ action: 'delete' })
  })
})

describe('validateRecurrence', () => {
  const valid = { description: 'Aluguel', amountCents: 150000, dayOfMonth: 5, startsOn: '2026-10-01', endsOn: null }

  it('aceita uma recorrente completa', () => {
    expect(validateRecurrence(valid)).toEqual({})
  })

  it('exige descrição, valor e dia de 1 a 31', () => {
    const errors = validateRecurrence({ ...valid, description: '  ', amountCents: 0, dayOfMonth: 32 })
    expect(Object.keys(errors).sort()).toEqual(['amount', 'day', 'description'])
    expect(validateRecurrence({ ...valid, dayOfMonth: 0 }).day).toBeTruthy()
    expect(validateRecurrence({ ...valid, dayOfMonth: 2.5 }).day).toBeTruthy()
  })

  it('término não pode ser antes do início', () => {
    expect(validateRecurrence({ ...valid, endsOn: '2026-09-30' }).endsOn).toBeTruthy()
    expect(validateRecurrence({ ...valid, endsOn: '2026-10-31' })).toEqual({})
  })
})
import { describe, expect, it } from 'vitest'
import { addMonths, dayLabel, monthKey, monthLabel, monthRange, parseMonthKey, toISODate } from './dates'

const today = new Date(2026, 9, 28) // 28/10/2026, hora local

describe('toISODate', () => {
  it('usa a data local, não UTC', () => {
    expect(toISODate(new Date(2026, 9, 28, 23, 30))).toBe('2026-10-28')
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('monthKey / parseMonthKey', () => {
  it('converte ida e volta', () => {
    expect(monthKey({ year: 2026, month: 10 })).toBe('2026-10')
    expect(parseMonthKey('2026-03')).toEqual({ year: 2026, month: 3 })
  })

  it('recusa chave inválida', () => {
    expect(parseMonthKey('2026-13')).toBeNull()
    expect(parseMonthKey('abc')).toBeNull()
    expect(parseMonthKey(null)).toBeNull()
  })
})

describe('monthRange (Q16: mês-calendário)', () => {
  it('vai do dia 1 ao último dia', () => {
    expect(monthRange({ year: 2026, month: 10 })).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(monthRange({ year: 2026, month: 2 })).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(monthRange({ year: 2028, month: 2 })).toEqual({ from: '2028-02-01', to: '2028-02-29' })
  })
})

describe('addMonths', () => {
  it('atravessa a virada do ano', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 })
  })
})

describe('monthLabel', () => {
  it('escreve o mês em português', () => {
    expect(monthLabel({ year: 2026, month: 10 })).toBe('Outubro de 2026')
  })
})

describe('dayLabel', () => {
  it('usa Hoje e Ontem', () => {
    expect(dayLabel('2026-10-28', today)).toBe('Hoje')
    expect(dayLabel('2026-10-27', today)).toBe('Ontem')
  })

  it('usa dia da semana e data no resto', () => {
    expect(dayLabel('2026-10-26', today)).toBe('Segunda, 26 de outubro')
  })
})

import { describe, expect, it } from 'vitest'
import {
  availableLimit,
  buildInstallments,
  buildInvoices,
  dueDateOf,
  invoiceMonthOf,
  invoicePeriod,
  splitInstallments,
} from './cardRules'

// Fecha dia 5, vence dia 12 (vencimento depois do fechamento: mesmo mês).
const card = { id: 9, type: 'credit', closingDay: 5, dueDay: 12, limitCents: 300000 }
// Fecha dia 28, vence dia 5 (vencimento ≤ fechamento: mês seguinte).
const late = { id: 9, type: 'credit', closingDay: 28, dueDay: 5 }

describe('invoiceMonthOf (Q59)', () => {
  it('até o fechamento, a compra cai na fatura do mês', () => {
    expect(invoiceMonthOf(card, '2026-10-05')).toEqual({ year: 2026, month: 10 })
    expect(invoiceMonthOf(card, '2026-10-01')).toEqual({ year: 2026, month: 10 })
  })

  it('depois do fechamento, vai para a fatura seguinte', () => {
    expect(invoiceMonthOf(card, '2026-10-06')).toEqual({ year: 2026, month: 11 })
    expect(invoiceMonthOf(card, '2026-12-20')).toEqual({ year: 2027, month: 1 })
  })

  it('fechamento no dia 31 vale o último dia em meses curtos', () => {
    const end = { ...card, closingDay: 31 }
    expect(invoiceMonthOf(end, '2027-02-28')).toEqual({ year: 2027, month: 2 })
    expect(invoiceMonthOf(end, '2027-03-01')).toEqual({ year: 2027, month: 3 })
  })
})

describe('dueDateOf e invoicePeriod', () => {
  it('vencimento depois do fechamento fica no mesmo mês', () => {
    expect(dueDateOf(card, { year: 2026, month: 10 })).toBe('2026-10-12')
  })

  it('vencimento antes do fechamento fica no mês seguinte', () => {
    expect(dueDateOf(late, { year: 2026, month: 10 })).toBe('2026-11-05')
    expect(dueDateOf(late, { year: 2026, month: 12 })).toBe('2027-01-05')
  })

  it('o período vai do dia seguinte ao fechamento anterior até o fechamento', () => {
    expect(invoicePeriod(card, { year: 2026, month: 10 })).toEqual({ from: '2026-09-06', to: '2026-10-05' })
    expect(invoicePeriod(late, { year: 2026, month: 3 })).toEqual({ from: '2026-03-01', to: '2026-03-28' })
  })
})

const t = (kind, amountCents, occurred_on, extra = {}) => ({ id: Math.random(), kind, amountCents, occurred_on, accountId: 9, ...extra })
const pay = (amountCents, occurred_on) => ({ id: Math.random(), kind: 'transfer', amountCents, occurred_on, accountId: 1, toAccountId: 9 })

describe('buildInvoices', () => {
  const today = new Date(2026, 9, 20) // 20/10/2026

  it('agrupa compras por fatura e soma; estorno (receita) desconta', () => {
    const list = [t('expense', 10000, '2026-09-10'), t('expense', 5000, '2026-10-02'), t('income', 2000, '2026-10-03'), t('expense', 7000, '2026-10-15')]
    const invoices = buildInvoices(card, list, today)
    expect(invoices.map((i) => [i.key, i.total])).toEqual([
      ['2026-10', 13000],
      ['2026-11', 7000],
    ])
  })

  it('pagamentos quitam as faturas mais antigas primeiro', () => {
    const list = [t('expense', 10000, '2026-08-10'), t('expense', 5000, '2026-09-10'), pay(12000, '2026-09-11')]
    const [sep, oct] = buildInvoices(card, list, today)
    expect(sep).toMatchObject({ key: '2026-09', paid: 10000, remaining: 0, status: 'paid' })
    expect(oct).toMatchObject({ key: '2026-10', paid: 2000, remaining: 3000 })
  })

  it('status: aberta até fechar, fechada até vencer, atrasada depois, paga quando quitada', () => {
    const list = [t('expense', 100, '2026-09-01'), t('expense', 100, '2026-10-01'), t('expense', 100, '2026-10-10')]
    const byKey = Object.fromEntries(buildInvoices(card, list, today).map((i) => [i.key, i.status]))
    expect(byKey).toEqual({ '2026-09': 'overdue', '2026-10': 'overdue', '2026-11': 'open' })

    const beforeDue = Object.fromEntries(buildInvoices(card, list, new Date(2026, 9, 8)).map((i) => [i.key, i.status]))
    expect(beforeDue['2026-10']).toBe('closed')
  })

  it('sempre mostra a fatura aberta de hoje, mesmo vazia', () => {
    const invoices = buildInvoices(card, [], today)
    expect(invoices).toHaveLength(1)
    expect(invoices[0]).toMatchObject({ key: '2026-11', total: 0, status: 'open', closesOn: '2026-11-05', dueOn: '2026-11-12' })
  })

  it('cada fatura traz os seus lançamentos, sem os pagamentos', () => {
    const list = [t('expense', 100, '2026-10-10'), pay(100, '2026-10-11')]
    const open = buildInvoices(card, list, today).at(-1)
    expect(open.items.map((i) => i.kind)).toEqual(['expense'])
  })
})

describe('availableLimit (Q61)', () => {
  it('é o limite menos o que se deve no cartão', () => {
    expect(availableLimit(card, -120000)).toBe(180000)
  })

  it('sem limite cadastrado, não há limite disponível', () => {
    expect(availableLimit(late, -100)).toBeNull()
  })
})

describe('parcelas (Q60)', () => {
  it('divide em partes iguais e os centavos que sobram vão na primeira', () => {
    expect(splitInstallments(10000, 3)).toEqual([3334, 3333, 3333])
    expect(splitInstallments(30000, 3)).toEqual([10000, 10000, 10000])
  })

  it('cria uma parcela por mês, a partir da data da compra', () => {
    const draft = { kind: 'expense', amountCents: 30000, date: '2026-10-31', description: 'Tênis', accountId: 9, categoryId: 2 }
    const parts = buildInstallments(draft, 3, 'grupo-1')
    expect(parts.map((p) => [p.date, p.amountCents, p.installmentNumber, p.installmentCount])).toEqual([
      ['2026-10-31', 10000, 1, 3],
      ['2026-11-30', 10000, 2, 3],
      ['2026-12-31', 10000, 3, 3],
    ])
    expect(parts.every((p) => p.installmentGroup === 'grupo-1' && p.description === 'Tênis' && p.categoryId === 2)).toBe(true)
  })
})

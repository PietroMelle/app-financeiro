import { describe, expect, it } from 'vitest'
import { buildCsv, csvNumber, exportFileName, presetRange, summarizeExport, validateRange } from './exportRules'

const today = new Date(2026, 0, 15) // 15/01/2026

describe('presetRange (Q64)', () => {
  it('este mês, mês passado (virando o ano) e este ano', () => {
    expect(presetRange('month', today)).toEqual({ from: '2026-01-01', to: '2026-01-31' })
    expect(presetRange('last', today)).toEqual({ from: '2025-12-01', to: '2025-12-31' })
    expect(presetRange('year', today)).toEqual({ from: '2026-01-01', to: '2026-12-31' })
  })

  it('"tudo" não tem limites', () => {
    expect(presetRange('all', today)).toEqual({ from: null, to: null })
  })
})

describe('validateRange', () => {
  it('exige as duas datas, na ordem certa', () => {
    expect(validateRange({ from: '2026-01-01', to: '' })).toBe('Informe as duas datas.')
    expect(validateRange({ from: '2026-02-01', to: '2026-01-01' })).toBe('A data inicial vem depois da final.')
    expect(validateRange({ from: '2026-01-01', to: '2026-01-01' })).toBeNull()
  })
})

describe('csvNumber', () => {
  it('vírgula nos centavos, sem milhar, com sinal', () => {
    expect(csvNumber(123456)).toBe('1234,56')
    expect(csvNumber(-5)).toBe('-0,05')
    expect(csvNumber(0)).toBe('0,00')
  })
})

const maps = {
  categoriesById: new Map([[1, { name: 'Mercado' }]]),
  accountsById: new Map([
    [10, { name: 'Carteira' }],
    [11, { name: 'Roxinho' }],
  ]),
  goalsById: new Map([[5, { name: 'Viagem' }]]),
  defaultAccountId: 10,
}
const t = (fields) => ({ id: Math.random(), description: '', created_at: '2026-01-01T00:00:00Z', ...fields })

describe('buildCsv (Q65, Q66)', () => {
  const lines = (csv) => csv.replace('﻿', '').trimEnd().split('\r\n')

  it('começa com BOM e o cabeçalho, separado por ponto e vírgula', () => {
    const csv = buildCsv([], maps)
    expect(csv.startsWith('﻿')).toBe(true)
    expect(lines(csv)).toEqual(['Data;Descrição;Tipo;Categoria;Conta;Conta destino;Meta;Parcela;Valor'])
  })

  it('uma linha por lançamento, da mais antiga para a mais nova, com nomes e sinais', () => {
    const csv = buildCsv(
      [
        t({ kind: 'income', amountCents: 500000, occurred_on: '2026-01-05', description: 'Salário', accountId: 10 }),
        t({ kind: 'expense', amountCents: 10000, occurred_on: '2026-01-02', categoryId: 1, accountId: 11, installmentNumber: 2, installmentCount: 3 }),
        t({ kind: 'transfer', amountCents: 20000, occurred_on: '2026-01-06', accountId: 10, toAccountId: 11 }),
        t({ kind: 'saving', amountCents: 3000, occurred_on: '2026-01-07', goalId: 5 }),
        t({ kind: 'withdrawal', amountCents: 1000, occurred_on: '2026-01-08', goalId: 5 }),
      ],
      maps,
    )
    expect(lines(csv).slice(1)).toEqual([
      '02/01/2026;;Despesa;Mercado;Roxinho;;;2/3;-100,00',
      '05/01/2026;Salário;Receita;;Carteira;;;;5000,00',
      '06/01/2026;;Transferência;;Carteira;Roxinho;;;200,00',
      '07/01/2026;;Guardado;;;;Viagem;;-30,00',
      '08/01/2026;;Resgate;;;;Viagem;;10,00',
    ])
  })

  it('lançamento sem conta usa a conta padrão', () => {
    const csv = buildCsv([t({ kind: 'expense', amountCents: 100, occurred_on: '2026-01-02' })], maps)
    expect(lines(csv)[1]).toBe('02/01/2026;;Despesa;;Carteira;;;;-1,00')
  })

  it('protege ponto e vírgula, aspas e fórmulas na descrição', () => {
    const csv = buildCsv(
      [
        t({ kind: 'expense', amountCents: 100, occurred_on: '2026-01-02', accountId: 10, description: 'Pão; leite "integral"' }),
        t({ kind: 'expense', amountCents: 100, occurred_on: '2026-01-03', accountId: 10, description: '=HYPERLINK("x")' }),
      ],
      maps,
    )
    expect(lines(csv)[1]).toContain(';"Pão; leite ""integral""";')
    expect(lines(csv)[2]).toContain(`;"'=HYPERLINK(""x"")";`)
  })
})

describe('summarizeExport', () => {
  it('conta tudo, mas entradas e saídas ignoram transferências', () => {
    const list = [
      t({ kind: 'income', amountCents: 1000 }),
      t({ kind: 'expense', amountCents: 300 }),
      t({ kind: 'saving', amountCents: 200 }),
      t({ kind: 'transfer', amountCents: 999 }),
    ]
    expect(summarizeExport(list)).toEqual({ count: 4, inflow: 1000, outflow: 500 })
  })
})

describe('exportFileName (Q68)', () => {
  it('leva o período no nome; "tudo" leva a data de hoje', () => {
    expect(exportFileName({ from: '2026-10-01', to: '2026-10-31' })).toBe('mea-financas_2026-10-01_a_2026-10-31.csv')
    expect(exportFileName({ from: null, to: null }, today)).toBe('mea-financas_tudo_2026-01-15.csv')
  })
})

import { KINDS } from '@/categories/kinds'
import { addMonths, currentMonth, monthRange, toISODate } from '@/lib/dates'

// Exportação em CSV (spec Q62 a Q68): no padrão que o Excel em português abre direto.

export const PRESETS = [
  { value: 'month', label: 'Este mês' },
  { value: 'last', label: 'Mês passado' },
  { value: 'year', label: 'Este ano' },
  { value: 'all', label: 'Tudo' },
  { value: 'custom', label: 'Personalizado' },
]

// Período de cada atalho; "Tudo" não tem limites (null nos dois lados).
export function presetRange(preset, today = new Date()) {
  const month = currentMonth(today)
  if (preset === 'month') return monthRange(month)
  if (preset === 'last') return monthRange(addMonths(month, -1))
  if (preset === 'year') return { from: `${month.year}-01-01`, to: `${month.year}-12-31` }
  return { from: null, to: null }
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

export function validateRange({ from, to }) {
  if (!ISO.test(from ?? '') || !ISO.test(to ?? '')) return 'Informe as duas datas.'
  if (from > to) return 'A data inicial vem depois da final.'
  return null
}

// Entradas positivas e saídas negativas: sem as transferências, a soma da coluna dá o saldo do período.
// Transferência só troca o dinheiro de conta: vai sem sinal.
export function signedValue(t) {
  return t.kind === 'expense' || t.kind === 'saving' ? -t.amountCents : t.amountCents
}

export function summarizeExport(transactions) {
  let inflow = 0
  let outflow = 0
  for (const t of transactions) {
    if (t.kind === 'transfer') continue
    const value = signedValue(t)
    if (value > 0) inflow += value
    else outflow -= value
  }
  return { count: transactions.length, inflow, outflow }
}

const HEADER = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Conta', 'Conta destino', 'Meta', 'Parcela', 'Valor']

// Vírgula nos centavos e sem separador de milhar, para o Excel ler como número.
export function csvNumber(cents) {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`
}

const brDate = (iso) => iso.split('-').reverse().join('/')

// Texto começando com = + - @ vira fórmula no Excel: um apóstrofo o deixa como texto.
function csvText(value) {
  let text = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildCsv(transactions, { categoriesById, accountsById, goalsById, defaultAccountId }) {
  const name = (map, id) => (id == null ? '' : (map.get(id)?.name ?? ''))
  const rows = [...transactions]
    .sort((a, b) => (a.occurred_on === b.occurred_on ? (a.created_at < b.created_at ? -1 : 1) : a.occurred_on < b.occurred_on ? -1 : 1))
    .map((t) => {
      const goal = t.kind === 'saving' || t.kind === 'withdrawal'
      return [
        brDate(t.occurred_on),
        csvText(t.description),
        KINDS[t.kind]?.singular ?? t.kind,
        csvText(name(categoriesById, t.categoryId)),
        csvText(goal ? '' : name(accountsById, t.accountId ?? defaultAccountId)),
        csvText(name(accountsById, t.toAccountId)),
        csvText(name(goalsById, t.goalId)),
        t.installmentCount ? `${t.installmentNumber}/${t.installmentCount}` : '',
        csvNumber(signedValue(t)),
      ].join(';')
    })
  // BOM: sem ele o Excel abre os acentos errado.
  return `﻿${[HEADER.join(';'), ...rows].join('\r\n')}\r\n`
}

export function exportFileName({ from, to }, today = new Date()) {
  return from && to ? `mea-financas_${from}_a_${to}.csv` : `mea-financas_tudo_${toISODate(today)}.csv`
}

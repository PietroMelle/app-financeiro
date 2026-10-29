import { addMonths, currentMonth, monthKey, monthOf, monthRange, toISODate } from '@/lib/dates'

// Recorrentes mensais (spec Q35, Q36). Mês é { year, month }; datas "AAAA-MM-DD".

const index = ({ year, month }) => year * 12 + month

export function dueDate(recurrence, { year, month }) {
  const lastDay = new Date(year, month, 0).getDate()
  const day = Math.min(recurrence.dayOfMonth, lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function isActiveIn(recurrence, month) {
  if (index(month) < index(monthOf(recurrence.startsOn))) return false
  return !recurrence.endsOn || index(month) <= index(monthOf(recurrence.endsOn))
}

const confirmedIn = (transactions, recurrenceId, month) =>
  transactions.some((t) => t.recurrenceId === recurrenceId && monthKey(monthOf(t.occurred_on)) === monthKey(month))

// Previstos do mês: recorrentes ativas sem confirmação naquele mês.
export function plannedFor(recurrences, transactions, month) {
  return recurrences
    .filter((r) => isActiveIn(r, month) && !confirmedIn(transactions, r.id, month))
    .map((r) => ({
      recurrenceId: r.id,
      kind: r.kind,
      amountCents: r.amountCents,
      categoryId: r.categoryId,
      accountId: r.accountId,
      description: r.description,
      date: dueDate(r, month),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

export function summarizePlanned(planned) {
  let income = 0
  let expense = 0
  for (const p of planned) {
    if (p.kind === 'income') income += p.amountCents
    else expense += p.amountCents
  }
  return { income, expense }
}

// Espelha as regras do banco (descrição 1–200, valor > 0, dia 1–31, término ≥ início).
export function validateRecurrence({ description, amountCents, dayOfMonth, startsOn, endsOn }) {
  const errors = {}
  const text = description.trim()
  if (!text) errors.description = 'Dê um nome, por exemplo: Aluguel.'
  else if (text.length > 200) errors.description = 'Use no máximo 200 caracteres.'
  if (!amountCents || amountCents <= 0) errors.amount = 'Informe um valor.'
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) errors.day = 'Use um dia de 1 a 31.'
  if (endsOn && endsOn < startsOn) errors.endsOn = 'O término precisa ser depois do início.'
  return errors
}

export function recurrenceErrorMessage(error, action = 'salvar') {
  if (error?.code === '23503') return 'A categoria escolhida não existe mais. Escolha outra.'
  if (error instanceof TypeError) return 'Sem conexão com o servidor. Verifique sua internet.'
  return `Não foi possível ${action}. Tente de novo.`
}

// Encerrar: se nunca foi usada, apaga; senão termina no último mês que já tem confirmação
// (este mês, se confirmada; senão o anterior), para o previsto deste mês sumir.
export function endPlan(recurrence, transactions, today = new Date()) {
  const month = currentMonth(today)
  if (confirmedIn(transactions, recurrence.id, month)) return { action: 'end', endsOn: toISODate(today) }
  const previous = addMonths(month, -1)
  if (index(previous) < index(monthOf(recurrence.startsOn))) return { action: 'delete' }
  return { action: 'end', endsOn: monthRange(previous).to }
}

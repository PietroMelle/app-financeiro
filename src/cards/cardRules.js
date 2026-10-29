import { addMonths, monthKey, monthOf, toISODate } from '@/lib/dates'

// Cartão de crédito (spec Q56 a Q61). Mês da fatura = mês em que ela fecha.

const pad = (n) => String(n).padStart(2, '0')
const lastDay = ({ year, month }) => new Date(year, month, 0).getDate()
const dayIn = (month, day) => `${month.year}-${pad(month.month)}-${pad(Math.min(day, lastDay(month)))}`
const index = ({ year, month }) => year * 12 + month

export const isCard = (account) => account?.type === 'credit'

// Fechamento no dia 31 vale o último dia nos meses curtos.
export const closingDateOf = (card, month) => dayIn(month, card.closingDay)

// Compra até o fechamento entra na fatura do mês; depois, na do mês seguinte.
export function invoiceMonthOf(card, isoDate) {
  const month = monthOf(isoDate)
  return isoDate <= closingDateOf(card, month) ? month : addMonths(month, 1)
}

// Vencimento depois do fechamento: mesmo mês; senão, no mês seguinte (o mais comum).
export function dueDateOf(card, month) {
  return dayIn(card.dueDay > card.closingDay ? month : addMonths(month, 1), card.dueDay)
}

export function invoicePeriod(card, month) {
  const [y, m, d] = closingDateOf(card, addMonths(month, -1)).split('-').map(Number)
  return { from: toISODate(new Date(y, m - 1, d + 1)), to: closingDateOf(card, month) }
}

const isPayment = (card) => (t) => t.kind === 'transfer' && t.toAccountId === card.id
// Compra soma; estorno (receita no cartão) desconta; transferência saindo do cartão conta como uso.
const charge = (t) => (t.kind === 'income' ? -t.amountCents : t.amountCents)

function statusOf(invoice, today) {
  if (today <= invoice.closesOn) return 'open'
  if (invoice.remaining <= 0) return 'paid'
  if (today > invoice.dueOn) return 'overdue'
  return 'closed'
}

// Faturas do cartão, da mais antiga para a mais nova, com o que foi pago de cada uma.
// Pagamentos quitam as faturas mais antigas primeiro (Q58).
export function buildInvoices(card, transactions, today = new Date()) {
  const todayISO = toISODate(today)
  const byKey = new Map()
  const ensure = (month) => {
    const key = monthKey(month)
    if (!byKey.has(key)) byKey.set(key, { key, month, items: [], total: 0 })
    return byKey.get(key)
  }

  let payments = 0
  for (const t of transactions) {
    if (isPayment(card)(t)) {
      payments += t.amountCents
      continue
    }
    if (t.accountId !== card.id) continue
    const invoice = ensure(invoiceMonthOf(card, t.occurred_on))
    invoice.items.push(t)
    invoice.total += charge(t)
  }
  ensure(invoiceMonthOf(card, todayISO))

  return [...byKey.values()]
    .sort((a, b) => index(a.month) - index(b.month))
    .map((invoice) => {
      const paid = Math.min(Math.max(invoice.total, 0), payments)
      payments -= paid
      const full = {
        ...invoice,
        ...invoicePeriod(card, invoice.month),
        closesOn: closingDateOf(card, invoice.month),
        dueOn: dueDateOf(card, invoice.month),
        paid,
        remaining: Math.max(invoice.total - paid, 0),
      }
      return { ...full, status: statusOf(full, todayISO) }
    })
}

// Limite menos a dívida (saldo do cartão é negativo quando se deve).
export function availableLimit(card, balanceCents) {
  return card.limitCents ? card.limitCents + Math.min(balanceCents, 0) : null
}

export function splitInstallments(amountCents, count) {
  const base = Math.floor(amountCents / count)
  return Array.from({ length: count }, (_, i) => (i === 0 ? amountCents - base * (count - 1) : base))
}

// Uma parcela por mês a partir da compra (dia 31 vira o último dia dos meses curtos).
export function buildInstallments(draft, count, group) {
  const start = monthOf(draft.date)
  const day = Number(draft.date.slice(8, 10))
  return splitInstallments(draft.amountCents, count).map((amountCents, i) => ({
    ...draft,
    amountCents,
    date: dayIn(addMonths(start, i), day),
    installmentGroup: group,
    installmentNumber: i + 1,
    installmentCount: count,
  }))
}

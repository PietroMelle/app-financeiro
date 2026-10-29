import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock, CreditCard, Lock } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { NEW_TRANSACTION_PATH } from '@/app/navItems'
import EmptyState from '@/components/EmptyState'
import Money from '@/components/Money'
import { Button } from '@/components/ui/button'
import AccountIcon from '@/accounts/AccountIcon'
import { useAccounts } from '@/accounts/useAccounts'
import { useCategories } from '@/categories/useCategories'
import { monthLabel } from '@/lib/dates'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import * as api from '@/transactions/api'
import TransactionList from '@/transactions/TransactionList'
import { groupByDay } from '@/transactions/transactionRules'
import { availableLimit, buildInvoices, isCard } from './cardRules'

// Selo branco dentro do card escuro (nos dois temas): tons escuros fixos para passar de 4.5:1.
const STATUS = {
  open: { label: 'Aberta', icon: Clock, tone: 'text-blue-700' },
  closed: { label: 'Fechada', icon: Lock, tone: 'text-amber-700' },
  overdue: { label: 'Atrasada', icon: AlertTriangle, tone: 'text-red-700' },
  paid: { label: 'Paga', icon: CheckCircle2, tone: 'text-emerald-700' },
}

const shortDate = (iso) => iso.split('-').reverse().slice(0, 2).join('/')

function useCardTransactions(cardId) {
  const [state, setState] = useState({ status: 'loading', transactions: [] })
  useEffect(() => {
    let current = true
    api.listForAccount(cardId).then(
      (transactions) => current && setState({ status: 'ready', transactions }),
      () => current && setState({ status: 'error', transactions: [] }),
    )
    return () => {
      current = false
    }
  }, [cardId])
  return state
}

function LimitBar({ card, balance }) {
  const available = availableLimit(card, balance)
  if (available == null) return null
  const used = Math.min(Math.max(card.limitCents - available, 0) / card.limitCents, 1)
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Limite disponível</span>
        <span className="font-semibold tabular-nums">
          {formatCents(Math.max(available, 0))} <span className="font-normal text-muted-foreground">de {formatCents(card.limitCents)}</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Limite usado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(used * 100)}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: used }}
          transition={{ type: 'spring', bounce: 0, visualDuration: 0.6 }}
          className={cn('h-full origin-left rounded-full', used >= 0.9 ? 'bg-expense' : used >= 0.7 ? 'bg-warning' : 'bg-link')}
        />
      </div>
    </div>
  )
}

export default function CardPage() {
  const { id } = useParams()
  const cardId = Number(id)
  const navigate = useNavigate()
  const { accounts, balances, defaultAccount, status: accountsStatus } = useAccounts()
  const { categories } = useCategories()
  const { status, transactions } = useCardTransactions(cardId)
  const [today] = useState(() => new Date())
  const [picked, setPicked] = useState(null)

  const card = accounts.find((a) => a.id === cardId)
  const invoices = useMemo(() => (card && isCard(card) ? buildInvoices(card, transactions, today) : []), [card, transactions, today])
  const openIndex = invoices.findIndex((i) => i.status === 'open')
  const index = picked ?? (openIndex >= 0 ? openIndex : invoices.length - 1)
  const invoice = invoices[index]
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])

  if (accountsStatus === 'loading' || status === 'loading') {
    return <span aria-hidden="true" className="block h-64 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none" />
  }
  if (!card || !isCard(card) || status === 'error') {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Cartão não encontrado"
        description="Ele pode ter sido apagado, ou a conexão falhou."
        action={
          <Button asChild variant="outline">
            <Link to="/contas">Ver contas</Link>
          </Button>
        }
      />
    )
  }

  const look = STATUS[invoice.status]
  const payFrom = defaultAccount && !isCard(defaultAccount) ? defaultAccount : accounts.find((a) => !isCard(a))
  function pay() {
    navigate(NEW_TRANSACTION_PATH, {
      state: {
        draft: {
          kind: 'transfer',
          accountId: payFrom?.id ?? null,
          toAccountId: card.id,
          amountCents: invoice.remaining,
          description: `Fatura de ${monthLabel(invoice.month).toLowerCase()}`,
        },
      },
    })
  }

  return (
    <>
      <header className="mb-6 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="-ml-3 shrink-0">
          <Link to="/contas" aria-label="Voltar para contas">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <AccountIcon account={card} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{card.name}</h1>
          <p className="text-sm text-muted-foreground">
            Fecha dia {card.closingDay} · vence dia {card.dueDay}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5">
        {card.limitCents && (
          <section className="rounded-2xl glass p-4">
            <LimitBar card={card} balance={balances.get(card.id) ?? 0} />
          </section>
        )}

        <nav aria-label="Faturas" className="flex items-center justify-between rounded-2xl glass p-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            disabled={index <= 0}
            onClick={() => setPicked(index - 1)}
            aria-label="Fatura anterior"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Button>
          <span className="font-semibold">Fatura de {monthLabel(invoice.month).toLowerCase()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            disabled={index >= invoices.length - 1}
            onClick={() => setPicked(index + 1)}
            aria-label="Próxima fatura"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </Button>
        </nav>

        <motion.section
          key={invoice.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
          aria-label={`Fatura de ${monthLabel(invoice.month)}`}
          className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f2937] via-[#1e293b] to-[#312e81] p-6 text-white ring-1 ring-white/10"
        >
          <span
            aria-hidden="true"
            className="absolute -top-14 -right-10 -z-10 size-48 rounded-full bg-violet-400/25 blur-3xl animate-aurora motion-reduce:animate-none"
          />
          <CreditCard aria-hidden="true" className="absolute top-5 right-5 size-6 text-white/40" />
          <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold', look.tone)}>
            <look.icon className="size-3.5" aria-hidden="true" />
            {look.label}
          </span>
          <p className="mt-3 text-sm font-medium text-white/80">Total da fatura</p>
          <Money cents={invoice.total} className="block text-4xl font-semibold tracking-tight" />
          <p className="mt-1 text-sm text-white/80">
            {invoice.status === 'open' ? 'Fecha' : 'Fechou'} em {shortDate(invoice.closesOn)} · vence em {shortDate(invoice.dueOn)}
          </p>
          {invoice.paid > 0 && invoice.remaining > 0 && (
            <p className="mt-1 text-sm text-white/80">
              Pago {formatCents(invoice.paid)} · falta {formatCents(invoice.remaining)}
            </p>
          )}
          {invoice.remaining > 0 && (
            <Button onClick={pay} className="mt-5 w-full bg-white text-[#1e293b] hover:bg-white/90">
              Pagar fatura
            </Button>
          )}
        </motion.section>

        {invoice.items.length > 0 ? (
          <TransactionList groups={groupByDay(invoice.items)} categoriesById={categoriesById} accountsById={accountsById} />
        ) : (
          <p className="rounded-2xl glass px-4 py-5 text-center text-sm text-muted-foreground">
            Nenhuma compra nesta fatura.
          </p>
        )}
      </div>
    </>
  )
}

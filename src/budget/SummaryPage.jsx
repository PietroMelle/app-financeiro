import { AlertCircle, ChevronRight, Gauge, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { NEW_TRANSACTION_PATH } from '@/app/navItems'
import EmptyState from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/categories/useCategories'
import { monthKey } from '@/lib/dates'
import { formatCents } from '@/lib/money'
import { useMonthParam } from '@/lib/useMonthParam'
import GoalsPreview from '@/goals/GoalsPreview'
import { useGoals } from '@/goals/useGoals'
import QuickEntry from '@/quick/QuickEntry'
import PlannedList from '@/recurring/PlannedList'
import { plannedFor, summarizePlanned } from '@/recurring/recurringRules'
import { useRecurrences } from '@/recurring/useRecurrences'
import MonthSwitcher from '@/transactions/MonthSwitcher'
import { TransactionRow } from '@/transactions/TransactionList'
import { summarize } from '@/transactions/transactionRules'
import { useTransactions } from '@/transactions/useTransactions'
import BalanceHero from './BalanceHero'
import { buildBudget } from './budgetRules'
import BudgetRow from './BudgetRow'
import { greeting, latest } from './summaryRules'

const LATEST_COUNT = 5

function Section({ title, action, children }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function SectionLink({ to, children }) {
  return (
    <Link to={to} className="text-sm font-medium text-link underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}

function SummarySkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-6">
      <span className="h-[188px] animate-pulse rounded-3xl bg-muted motion-reduce:animate-none" />
      <span className="h-40 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
    </div>
  )
}

export default function SummaryPage({ session }) {
  const navigate = useNavigate()
  const { month, direction, goToMonth } = useMonthParam()
  const { status, transactions, reload, refresh } = useTransactions(month)
  const { categories, status: categoriesStatus } = useCategories()
  const [title] = useState(() => greeting(new Date(), session.user.user_metadata?.first_name ?? ''))

  const { recurrences, status: recurrencesStatus } = useRecurrences()
  const { goals, saved, status: goalsStatus } = useGoals()
  const goalsById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])

  const key = monthKey(month)
  const budget = useMemo(() => buildBudget(categories, transactions), [categories, transactions])
  const recent = useMemo(() => latest(transactions, LATEST_COUNT), [transactions])
  const planned = useMemo(() => plannedFor(recurrences, transactions, month), [recurrences, transactions, month])
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  // Se as recorrentes falharem, o Resumo segue sem os previstos.
  const loading = status === 'loading' || categoriesStatus === 'loading' || recurrencesStatus === 'loading'
  const failed = status === 'error' || categoriesStatus === 'error'
  const filtered = (categoryId) => `/transacoes?mes=${key}&categoria=${categoryId ?? 'sem'}`

  return (
    <>
      <header className="mb-5">
        <p className="text-sm text-muted-foreground">Resumo do mês</p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
      </header>

      <QuickEntry
        categories={categories}
        onSaved={refresh}
        onAdjust={(draft) => navigate(NEW_TRANSACTION_PATH, { state: { draft } })}
        className="mb-4"
      />

      <MonthSwitcher month={month} onPrev={() => goToMonth(-1)} onNext={() => goToMonth(1)} />

      <motion.div
        key={key}
        initial={{ opacity: 0, x: direction * 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
        className="mt-4 grid grid-cols-1 gap-7"
        aria-busy={loading}
      >
        {loading && <SummarySkeleton />}

        {!loading && failed && (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar o resumo"
            description="Verifique sua conexão e tente de novo."
            action={
              <Button variant="outline" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        )}

        {!loading && !failed && (
          <>
            <BalanceHero summary={summarize(transactions)} plannedExpense={summarizePlanned(planned).expense} />

            {planned.length > 0 && (
              <Section title="Previstos do mês" action={<SectionLink to="/recorrentes">Gerenciar</SectionLink>}>
                <PlannedList planned={planned} categoriesById={categoriesById} onConfirmed={refresh} />
              </Section>
            )}

            <Section
              title="Orçamento"
              action={budget.limited.length > 0 && <SectionLink to="/categorias">Ajustar limites</SectionLink>}
            >
              {budget.limited.length > 0 ? (
                <ul className="overflow-hidden rounded-2xl glass">
                  {budget.limited.map((row, index) => (
                    <BudgetRow key={row.id} row={row} index={index} href={filtered(row.id)} />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Gauge}
                  title="Nenhum limite definido"
                  description="Defina quanto quer gastar por mês em cada categoria e acompanhe aqui."
                  action={
                    <Button asChild variant="outline">
                      <Link to="/categorias">Definir limites</Link>
                    </Button>
                  }
                />
              )}
            </Section>

            {goalsStatus === 'ready' && (
              <Section title="Metas" action={goals.length > 0 && <SectionLink to="/metas">Ver metas</SectionLink>}>
                <GoalsPreview goals={goals} saved={saved} />
              </Section>
            )}

            <Section
              title="Últimos lançamentos"
              action={recent.length > 0 && <SectionLink to={`/transacoes?mes=${key}`}>Ver todos</SectionLink>}
            >
              {recent.length > 0 ? (
                <ul className="overflow-hidden rounded-2xl glass">
                  {recent.map((t) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      category={categoriesById.get(t.categoryId)}
                      goal={goalsById.get(t.goalId)}
                      showDate
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl glass px-4 py-5 text-center text-sm text-muted-foreground">
                  Nenhum lançamento neste mês.{' '}
                  <Link
                    to={NEW_TRANSACTION_PATH}
                    className="inline-flex items-center gap-1 font-medium text-link underline-offset-4 hover:underline"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Novo lançamento
                  </Link>
                </p>
              )}
            </Section>

            {budget.unlimited.length > 0 && (
              <Section title="Outros gastos">
                <ul className="overflow-hidden rounded-2xl glass">
                  {budget.unlimited.map((row) => (
                    <li key={row.id ?? 'none'} className="border-b last:border-b-0">
                      <Link
                        to={filtered(row.id)}
                        className="group flex min-h-14 items-center gap-3 px-4 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                      >
                        <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                        <span className="shrink-0 font-semibold tabular-nums">{formatCents(row.spent)}</span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
      </motion.div>
    </>
  )
}

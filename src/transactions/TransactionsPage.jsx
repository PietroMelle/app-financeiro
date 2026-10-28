import { AlertCircle, Plus, ReceiptText, Repeat } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useId, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { sortByName } from '@/categories/categoryRules'
import { useCategories } from '@/categories/useCategories'
import { monthKey } from '@/lib/dates'
import { useMonthParam } from '@/lib/useMonthParam'
import { NEW_TRANSACTION_PATH } from '@/app/navItems'
import { useGoals } from '@/goals/useGoals'
import PlannedList from '@/recurring/PlannedList'
import { plannedFor, summarizePlanned } from '@/recurring/recurringRules'
import { useRecurrences } from '@/recurring/useRecurrences'
import MonthSummary from './MonthSummary'
import MonthSwitcher from './MonthSwitcher'
import TransactionList from './TransactionList'
import { groupByDay, summarize } from './transactionRules'
import { useTransactions } from './useTransactions'

const ALL = 'todas'
const NONE = 'sem'
const SAVED = 'guardados'

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-2">
      <span className="h-4 w-20 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <ul className="overflow-hidden rounded-xl glass">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex min-h-16 items-center gap-3 border-b px-4 last:border-b-0">
            <span className="size-10 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
            <span className="h-4 flex-1 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <span className="h-4 w-16 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function TransactionsPage() {
  const filterId = useId()
  const [params, setParams] = useSearchParams()
  const { month, direction, goToMonth } = useMonthParam()
  const filter = params.get('categoria') ?? ALL

  const { status, transactions, reload, refresh } = useTransactions(month)
  const { categories } = useCategories()
  const { recurrences } = useRecurrences()
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const { goals } = useGoals()
  const goalsById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])

  // Guardado não tem categoria, mas também não é "Sem categoria": tem filtro próprio.
  const matches = useCallback(
    ({ kind = 'expense', categoryId }) => {
      if (filter === ALL) return true
      if (filter === SAVED) return kind === 'saving'
      if (kind === 'saving') return false
      return filter === NONE ? categoryId == null : String(categoryId) === filter
    },
    [filter],
  )
  const visible = useMemo(() => transactions.filter(matches), [transactions, matches])
  const planned = useMemo(
    () => plannedFor(recurrences, transactions, month).filter(matches),
    [recurrences, transactions, month, matches],
  )

  function setParam(name, value, fallback) {
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        if (value === fallback) next.delete(name)
        else next.set(name, value)
        return next
      },
      { replace: true },
    )
  }

  return (
    <>
      <PageHeader
        title="Transações"
        action={
          <Button asChild variant="outline">
            <Link to="/recorrentes">
              <Repeat aria-hidden="true" />
              Recorrentes
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3">
        <MonthSwitcher month={month} onPrev={() => goToMonth(-1)} onNext={() => goToMonth(1)} />

        <div className="flex items-center gap-2">
          <label htmlFor={filterId} className="shrink-0 text-sm font-medium text-muted-foreground">
            Categoria
          </label>
          <select
            id={filterId}
            value={filter}
            onChange={(e) => setParam('categoria', e.target.value, ALL)}
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value={ALL}>Todas</option>
            <option value={NONE}>Sem categoria</option>
            <option value={SAVED}>Guardados em metas</option>
            {['expense', 'income'].map((kind) => (
              <optgroup key={kind} label={kind === 'expense' ? 'Despesas' : 'Receitas'}>
                {sortByName(categories.filter((c) => c.kind === kind)).map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <motion.div
        key={monthKey(month)}
        initial={{ opacity: 0, x: direction * 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
        className="mt-4 grid grid-cols-1 gap-5"
        aria-busy={status === 'loading'}
      >
        {status === 'ready' && <MonthSummary summary={summarize(visible)} planned={summarizePlanned(planned)} />}

        {status === 'ready' && planned.length > 0 && (
          <section aria-labelledby={`${filterId}-planned`}>
            <h2 id={`${filterId}-planned`} className="mb-2 px-1 text-sm font-semibold">
              Previstos
            </h2>
            <PlannedList planned={planned} categoriesById={categoriesById} onConfirmed={refresh} />
          </section>
        )}

        {status === 'loading' && <ListSkeleton />}

        {status === 'error' && (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar os lançamentos"
            description="Verifique sua conexão e tente de novo."
            action={
              <Button variant="outline" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        )}

        {status === 'ready' && visible.length === 0 && planned.length === 0 && (
          <EmptyState
            icon={ReceiptText}
            title={transactions.length === 0 ? 'Nenhum lançamento neste mês' : 'Nada nesta categoria'}
            description={
              transactions.length === 0
                ? 'Registre seu primeiro gasto ou receita do mês.'
                : 'Escolha outra categoria ou veja todas.'
            }
            action={
              transactions.length === 0 ? (
                <Button asChild variant="outline">
                  <Link to={NEW_TRANSACTION_PATH}>
                    <Plus aria-hidden="true" />
                    Novo lançamento
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setParam('categoria', ALL, ALL)}>
                  Ver todas
                </Button>
              )
            }
          />
        )}

        {status === 'ready' && visible.length > 0 && (
          <TransactionList groups={groupByDay(visible)} categoriesById={categoriesById} goalsById={goalsById} />
        )}
      </motion.div>
    </>
  )
}

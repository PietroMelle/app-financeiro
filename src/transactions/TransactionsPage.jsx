import { AlertCircle, Plus, ReceiptText } from 'lucide-react'
import { motion } from 'motion/react'
import { useId, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { sortByName } from '@/categories/categoryRules'
import { useCategories } from '@/categories/useCategories'
import { monthKey } from '@/lib/dates'
import { useMonthParam } from '@/lib/useMonthParam'
import { NEW_TRANSACTION_PATH } from '@/app/navItems'
import MonthSummary from './MonthSummary'
import MonthSwitcher from './MonthSwitcher'
import TransactionList from './TransactionList'
import { groupByDay, summarize } from './transactionRules'
import { useTransactions } from './useTransactions'

const ALL = 'todas'
const NONE = 'sem'

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-2">
      <span className="h-4 w-20 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <ul className="overflow-hidden rounded-xl border bg-card">
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

  const { status, transactions, reload } = useTransactions(month)
  const { categories } = useCategories()
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const visible = useMemo(() => {
    if (filter === ALL) return transactions
    if (filter === NONE) return transactions.filter((t) => t.categoryId == null)
    return transactions.filter((t) => String(t.categoryId) === filter)
  }, [transactions, filter])

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
      <PageHeader title="Transações" />

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
        className="mt-4 grid gap-5"
        aria-busy={status === 'loading'}
      >
        {status === 'ready' && <MonthSummary summary={summarize(visible)} />}

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

        {status === 'ready' && visible.length === 0 && (
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
          <TransactionList groups={groupByDay(visible)} categoriesById={categoriesById} />
        )}
      </motion.div>
    </>
  )
}

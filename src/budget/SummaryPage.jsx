import { AlertCircle, Gauge, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { NEW_TRANSACTION_PATH } from '@/app/navItems'
import EmptyState from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/categories/useCategories'
import { monthKey } from '@/lib/dates'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { useMonthParam } from '@/lib/useMonthParam'
import BalanceTotal from '@/accounts/BalanceTotal'
import AssistantTeaser from '@/assistant/AssistantTeaser'
import { cardsDebt, totalBalance } from '@/accounts/accountRules'
import { useAccounts } from '@/accounts/useAccounts'
import GoalsPreview from '@/goals/GoalsPreview'
import { useGoals } from '@/goals/useGoals'
import QuickEntry from '@/quick/QuickEntry'
import PlannedList from '@/recurring/PlannedList'
import { plannedFor, summarizePlanned } from '@/recurring/recurringRules'
import { useRecurrences } from '@/recurring/useRecurrences'
import DonutChart from '@/reports/DonutChart'
import { byCategory } from '@/reports/reportRules'
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

// Troca de mês: o conteúdo entra deslizando do lado do mês escolhido.
function MonthContent({ monthKey, direction, busy, children }) {
  return (
    <motion.div
      key={monthKey}
      initial={{ opacity: 0, x: direction * 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
      className="grid grid-cols-1 gap-7"
      aria-busy={busy}
    >
      {children}
    </motion.div>
  )
}

export default function SummaryPage({ session }) {
  const navigate = useNavigate()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const { month, direction, goToMonth } = useMonthParam()
  const { status, transactions, reload, refresh } = useTransactions(month)
  const { categories, status: categoriesStatus } = useCategories()
  const [title] = useState(() => greeting(new Date(), session.user.user_metadata?.first_name ?? ''))

  const { recurrences, status: recurrencesStatus } = useRecurrences()
  const { goals, saved, status: goalsStatus, reload: reloadGoals } = useGoals()
  const goalsById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])
  const { accounts, balances, defaultAccount, status: accountsStatus, refresh: refreshAccounts } = useAccounts()
  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const reserved = useMemo(() => [...saved.values()].reduce((s, c) => s + c, 0), [saved])

  const key = monthKey(month)
  const budget = useMemo(() => buildBudget(categories, transactions), [categories, transactions])
  const spending = useMemo(() => byCategory(transactions, categories), [transactions, categories])
  const recent = useMemo(() => latest(transactions, LATEST_COUNT), [transactions])
  const planned = useMemo(() => plannedFor(recurrences, transactions, month), [recurrences, transactions, month])
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  // Se as recorrentes falharem, o Resumo segue sem os previstos.
  const loading = status === 'loading' || categoriesStatus === 'loading' || recurrencesStatus === 'loading'
  const failed = status === 'error' || categoriesStatus === 'error'
  const filtered = (categoryId) => `/transacoes?mes=${key}&categoria=${categoryId ?? 'sem'}`

  const sections = {
    hero: (
      <BalanceHero key="hero" summary={summarize(transactions)} plannedExpense={summarizePlanned(planned).expense} />
    ),

    // Saldo de hoje em todas as contas (Q51); o card de cima é o "Disponível" do mês.
    accounts: accountsStatus === 'ready' && accounts.length > 0 && (
      <Link
        key="accounts"
        to="/contas"
        aria-label="Ver contas"
        className="group block rounded-3xl transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:scale-[0.99]"
      >
        <BalanceTotal total={totalBalance(balances, accounts)} reserved={reserved} debt={cardsDebt(balances, accounts)} compact />
      </Link>
    ),

    planned: planned.length > 0 && (
      <Section key="planned" title="Previstos do mês" action={<SectionLink to="/recorrentes">Gerenciar</SectionLink>}>
        <PlannedList
          planned={planned}
          categoriesById={categoriesById}
          defaultAccountId={defaultAccount?.id}
          onConfirmed={() => {
            refresh()
            refreshAccounts()
          }}
        />
      </Section>
    ),

    spending: spending.total > 0 && (
      <Section
        key="spending"
        title="Gastos do mês"
        action={<SectionLink to={`/relatorios?mes=${key}`}>Relatórios</SectionLink>}
      >
        <div className="rounded-2xl glass p-4">
          <DonutChart
            slices={spending.slices}
            total={spending.total}
            label="Gastos do mês por categoria"
            hrefFor={(slice) => (slice.id === 'other' ? `/transacoes?mes=${key}` : filtered(slice.id))}
          />
        </div>
      </Section>
    ),

    budget: (
      <Section
        key="budget"
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
    ),

    goals: goalsStatus === 'ready' && (
      <Section key="goals" title="Metas" action={goals.length > 0 && <SectionLink to="/metas">Ver metas</SectionLink>}>
        <GoalsPreview goals={goals} saved={saved} />
      </Section>
    ),

    latest: (
      <Section
        key="latest"
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
                accountsById={accountsById}
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
    ),
  }

  const quick = (
    <QuickEntry
      categories={categories}
      goals={goals}
      saved={saved}
      accounts={accounts}
      onSaved={() => {
        refresh()
        reloadGoals()
        refreshAccounts()
      }}
      onAdjust={(draft) => navigate(NEW_TRANSACTION_PATH, { state: { draft } })}
    />
  )
  const switcher = <MonthSwitcher month={month} onPrev={() => goToMonth(-1)} onNext={() => goToMonth(1)} />
  // Carregando ou erro ocupam o lugar do conteúdo (no PC, a coluna da esquerda).
  const state = loading ? (
    <SummarySkeleton />
  ) : failed ? (
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
  ) : null

  return (
    <>
      <header className="mb-5">
        <p className="text-sm text-muted-foreground">Resumo do mês</p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
      </header>

      {desktop ? (
        // PC: painel em duas colunas (referência visual da spec); cada coluna começa no topo.
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,24rem)] items-start gap-7">
          <div className="grid grid-cols-1 gap-4">
            {switcher}
            <MonthContent monthKey={key} direction={direction} busy={loading}>
              {state ?? [sections.hero, sections.spending, sections.budget]}
            </MonthContent>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {quick}
            <AssistantTeaser />
            <MonthContent monthKey={key} direction={direction} busy={loading}>
              {!state && [sections.accounts, sections.planned, sections.goals, sections.latest]}
            </MonthContent>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {quick}
          <AssistantTeaser />
          {switcher}
          <MonthContent monthKey={key} direction={direction} busy={loading}>
            {state ?? [
              sections.hero,
              sections.accounts,
              sections.planned,
              sections.spending,
              sections.budget,
              sections.goals,
              sections.latest,
            ]}
          </MonthContent>
        </div>
      )}
    </>
  )
}

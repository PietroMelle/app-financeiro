import { AlertCircle, ChartColumn } from 'lucide-react'
import { motion } from 'motion/react'
import { useId, useMemo, useState } from 'react'
import EmptyState from '@/components/EmptyState'
import Money from '@/components/Money'
import PageHeader from '@/components/PageHeader'
import { useCategories } from '@/categories/useCategories'
import { addMonths, monthLabel, monthKey, monthRange } from '@/lib/dates'
import { formatCents } from '@/lib/money'
import { useMonthParam } from '@/lib/useMonthParam'
import { cn } from '@/lib/utils'
import MonthSwitcher from '@/transactions/MonthSwitcher'
import { useTransactionsBetween } from '@/transactions/useTransactions'
import ColumnChart from './ColumnChart'
import DonutChart from './DonutChart'
import { byCategory, monthlySeries } from './reportRules'

const MONTHS = 6

// Tabela: só o número (o "R$" fica no título) para caber no celular.
const plain = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const amount = (cents) => (cents < 0 ? '−' : '') + plain.format(Math.abs(cents) / 100)

const TABS = [
  { value: 'balance', label: 'Saldo', color: 'var(--cat-1)', title: 'Saldo de cada mês' },
  { value: 'income', label: 'Receitas', color: 'var(--income)', title: 'Receitas de cada mês' },
  { value: 'expense', label: 'Despesas', color: 'var(--expense)', title: 'Despesas de cada mês' },
]

const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
const short = ({ year, month }) => shortMonth.format(new Date(year, month - 1, 1)).replace('.', '')

function Tabs({ value, onChange }) {
  const id = useId()
  return (
    <div role="tablist" aria-label="O que mostrar" className="grid grid-cols-3 rounded-xl bg-muted p-1">
      {TABS.map((tab) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative h-10 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {selected && (
              <motion.span
                layoutId={`${id}-tab`}
                transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
                className="absolute inset-0 rounded-lg bg-raised shadow-sm ring-1 ring-border"
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Stat({ label, cents, hint, wide, className }) {
  return (
    <div className={cn('min-w-0 rounded-2xl glass px-4 py-3', wide && 'col-span-2 sm:col-span-1')}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Money cents={cents} className={cn('mt-1 block truncate text-lg font-semibold', className)} />
      {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export default function ReportsPage() {
  const { month, goToMonth } = useMonthParam()
  const [tab, setTab] = useState('balance')
  const first = addMonths(month, -(MONTHS - 1))
  const { status, stale, transactions } = useTransactionsBetween(monthRange(first).from, monthRange(month).to)
  const { categories, status: categoriesStatus } = useCategories()

  const series = useMemo(() => monthlySeries(transactions, month, MONTHS), [transactions, month])
  const categoryData = useMemo(() => byCategory(transactions, categories), [transactions, categories])
  const current = TABS.find((t) => t.value === tab)
  const chartData = series.map((m) => ({
    key: m.key,
    label: short(m.month),
    fullLabel: monthLabel(m.month),
    value: m[tab],
  }))
  const totals = series.reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense, saved: acc.saved + m.saved }),
    { income: 0, expense: 0, saved: 0 },
  )
  const monthsWithData = series.filter((m) => m.income || m.expense || m.saved).length || 1
  const period =
    first.year === month.year
      ? `${short(first)} a ${short(month)} de ${month.year}`
      : `${short(first)}/${first.year} a ${short(month)}/${month.year}`

  return (
    <>
      <PageHeader title="Relatórios" description={`Últimos ${MONTHS} meses: ${period}`} />

      <MonthSwitcher month={month} onPrev={() => goToMonth(-1)} onNext={() => goToMonth(1)} />

      {status === 'error' && (
        <div className="mt-4">
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar os relatórios"
            description="Verifique sua conexão e tente de novo."
          />
        </div>
      )}

      {status === 'loading' && (
        <div aria-hidden="true" className="mt-4 grid gap-4">
          <span className="h-24 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
          <span className="h-72 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
        </div>
      )}

      {status === 'ready' && transactions.length === 0 && !stale && (
        <div className="mt-4">
          <EmptyState
            icon={ChartColumn}
            title="Ainda não há o que mostrar"
            description="Os gráficos aparecem assim que você registrar receitas e despesas."
          />
        </div>
      )}

      {status === 'ready' && transactions.length > 0 && (
        <div
          aria-busy={stale}
          className={cn(
            'mt-4 grid grid-cols-1 gap-6 transition-opacity lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]',
            stale && 'opacity-60',
          )}
        >
          <div className="grid content-start gap-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat
                label="Gasto médio por mês"
                cents={Math.round(totals.expense / monthsWithData)}
                className="text-expense"
              />
              <Stat
                label="Receita média por mês"
                cents={Math.round(totals.income / monthsWithData)}
                className="text-income"
              />
              <Stat
                wide
                label="Guardado no período"
                cents={totals.saved}
                className="text-gold"
                hint={totals.saved ? undefined : 'Nada guardado ainda'}
              />
            </div>

            <section aria-labelledby="evolucao" className="grid gap-4 rounded-2xl glass p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="evolucao" className="font-semibold">
                  {current.title}
                </h2>
              </div>
              <Tabs value={tab} onChange={setTab} />
              <div className="pt-6">
                <ColumnChart
                  data={chartData}
                  color={current.color}
                  highlightKey={monthKey(month)}
                  label={current.title}
                />
              </div>
            </section>

            <section aria-labelledby="tabela" className="overflow-hidden rounded-2xl glass">
              <h2 id="tabela" className="px-4 pt-4 pb-2 font-semibold">
                Mês a mês <span className="text-sm font-normal text-muted-foreground">· valores em R$</span>
              </h2>
              <table className="w-full text-sm whitespace-nowrap tabular-nums">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th scope="col" className="px-4 py-2 text-left font-medium">
                      Mês
                    </th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">
                      Receitas
                    </th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">
                      Despesas
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...series].reverse().map((m) => (
                    <tr key={m.key} className={cn('border-t', m.key === monthKey(month) && 'bg-muted font-medium')}>
                      <th scope="row" className="px-4 py-2.5 text-left font-medium capitalize">
                        {short(m.month)}
                        <span className="sr-only"> {m.month.year}</span>
                      </th>
                      <td className="px-2 py-2.5 text-right">{amount(m.income)}</td>
                      <td className="px-2 py-2.5 text-right">{amount(m.expense)}</td>
                      <td className={cn('px-4 py-2.5 text-right font-semibold', m.balance < 0 && 'text-expense')}>
                        {amount(m.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totals.saved > 0 && (
                <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
                  O saldo já desconta o que foi guardado em metas ({formatCents(totals.saved)} no período).
                </p>
              )}
            </section>
          </div>

          <section aria-labelledby="categorias" className="grid content-start gap-4 rounded-2xl glass p-4">
            <h2 id="categorias" className="font-semibold">
              Para onde foi o dinheiro
            </h2>
            {categoriesStatus !== 'ready' ? (
              <span aria-hidden="true" className="h-48 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
            ) : categoryData.total > 0 ? (
              <DonutChart
                slices={categoryData.slices}
                total={categoryData.total}
                label="Despesas por categoria no período"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma despesa no período.</p>
            )}
          </section>
        </div>
      )}
    </>
  )
}

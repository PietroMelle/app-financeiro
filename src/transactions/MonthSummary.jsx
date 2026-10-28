import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'

function Stat({ label, value, className }) {
  return (
    <div className="min-w-0 rounded-xl border bg-card px-3 py-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 truncate text-sm font-semibold tabular-nums sm:text-base', className)}>{value}</dd>
    </div>
  )
}

export default function MonthSummary({ summary }) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      <Stat label="Receitas" value={formatCents(summary.income)} className="text-income" />
      <Stat label="Despesas" value={formatCents(summary.expense)} className="text-expense" />
      <Stat
        label="Saldo"
        value={`${summary.balance < 0 ? '− ' : ''}${formatCents(Math.abs(summary.balance))}`}
        className={summary.balance < 0 ? 'text-expense' : 'text-foreground'}
      />
    </dl>
  )
}

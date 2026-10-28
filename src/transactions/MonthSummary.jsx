import Money from '@/components/Money'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'

function Stat({ label, cents, signed, planned, className }) {
  return (
    <div className="min-w-0 rounded-2xl glass px-3 py-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 truncate text-sm font-semibold sm:text-base', className)}>
        <Money cents={cents} signed={signed} />
      </dd>
      {planned > 0 && (
        <dd className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">+ {formatCents(planned)} previsto</dd>
      )}
    </div>
  )
}

export default function MonthSummary({ summary, planned = { income: 0, expense: 0 } }) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      <Stat label="Receitas" cents={summary.income} planned={planned.income} className="text-income" />
      <Stat label="Despesas" cents={summary.expense} planned={planned.expense} className="text-expense" />
      <Stat
        label="Saldo"
        cents={summary.balance}
        signed
        className={summary.balance < 0 ? 'text-expense' : 'text-foreground'}
      />
    </dl>
  )
}

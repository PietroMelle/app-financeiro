import Money from '@/components/Money'
import { cn } from '@/lib/utils'

function Stat({ label, cents, signed, className }) {
  return (
    <div className="min-w-0 rounded-2xl glass px-3 py-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 truncate text-sm font-semibold sm:text-base', className)}>
        <Money cents={cents} signed={signed} />
      </dd>
    </div>
  )
}

export default function MonthSummary({ summary }) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      <Stat label="Receitas" cents={summary.income} className="text-income" />
      <Stat label="Despesas" cents={summary.expense} className="text-expense" />
      <Stat
        label="Saldo"
        cents={summary.balance}
        signed
        className={summary.balance < 0 ? 'text-expense' : 'text-foreground'}
      />
    </dl>
  )
}

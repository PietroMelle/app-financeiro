import MoneyInput from '@/components/MoneyInput'
import { cn } from '@/lib/utils'

export default function AmountInput({ id, cents, onChange, kind, invalid, describedBy }) {
  return (
    <MoneyInput
      id={id}
      cents={cents}
      onChange={onChange}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(
        'w-full rounded-xl bg-transparent py-2 text-center text-4xl font-semibold tracking-tight tabular-nums outline-none transition-colors focus-visible:bg-muted sm:text-5xl',
        cents === 0
          ? 'text-muted-foreground'
          : kind === 'income'
            ? 'text-income'
            : kind === 'saving'
              ? 'text-gold'
              : 'text-expense',
      )}
    />
  )
}

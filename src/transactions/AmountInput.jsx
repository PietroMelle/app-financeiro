import { centsFromDigits, formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'

// Estilo app de banco: cada dígito entra pela direita (1, 2, 5, 0 -> R$ 12,50).
export default function AmountInput({ id, cents, onChange, kind, invalid, describedBy }) {
  const keepCaretAtEnd = (event) => {
    const el = event.currentTarget
    const end = el.value.length
    if (el.selectionStart !== end || el.selectionEnd !== end) el.setSelectionRange(end, end)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatCents(cents)}
      onChange={(e) => onChange(centsFromDigits(e.target.value))}
      onFocus={keepCaretAtEnd}
      onSelect={keepCaretAtEnd}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(
        'w-full rounded-xl bg-transparent py-2 text-center text-4xl font-semibold tracking-tight tabular-nums outline-none transition-colors focus-visible:bg-muted sm:text-5xl',
        cents === 0 ? 'text-muted-foreground' : kind === 'income' ? 'text-income' : 'text-expense',
      )}
    />
  )
}

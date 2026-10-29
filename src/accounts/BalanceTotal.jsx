import { CreditCard } from 'lucide-react'
import Money from '@/components/Money'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'

// Card de saldo total (Q51, Q53): o guardado em metas é reserva dentro das contas.
// Cartões ficam fora da soma; o que se deve neles aparece à parte (Q61).
export default function BalanceTotal({ total, reserved, debt = 0, compact = false }) {
  return (
    <section
      aria-label="Saldo em contas"
      className={cn(
        'relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f3b46] via-[#12405a] to-[#1e3a8a] text-white ring-1 ring-white/10',
        compact ? 'p-4' : 'p-6',
      )}
    >
      <span
        aria-hidden="true"
        className="absolute -top-12 -right-10 -z-10 size-48 rounded-full bg-teal-300/20 blur-3xl animate-aurora motion-reduce:animate-none"
      />
      <p className="text-sm font-medium text-white/80">Saldo em contas</p>
      <Money cents={total} signed className={cn('block font-semibold tracking-tight', compact ? 'text-2xl' : 'text-4xl')} />
      {reserved > 0 && (
        <p className="mt-1 text-sm text-white/80">
          dos quais {formatCents(reserved)} reservados em metas · livre {formatCents(total - reserved)}
        </p>
      )}
      {debt > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white/90">
          <CreditCard className="size-4 shrink-0" aria-hidden="true" />
          Faturas a pagar: {formatCents(debt)}
        </p>
      )}
    </section>
  )
}

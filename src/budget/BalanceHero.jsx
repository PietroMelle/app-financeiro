import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Money from '@/components/Money'
import { formatCents } from '@/lib/money'
import { availableToSpend } from './summaryRules'

// Card principal do Resumo. Gradiente só com tons profundos para o texto branco passar de 4.5:1.
export default function BalanceHero({ summary, plannedExpense = 0 }) {
  const available = availableToSpend({ ...summary, plannedExpense })
  const deducted = [
    summary.saved > 0 && `${formatCents(summary.saved)} guardados em metas`,
    plannedExpense > 0 && `${formatCents(plannedExpense)} em contas previstas`,
  ].filter(Boolean)

  return (
    <section
      aria-label="Disponível para gastar"
      className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#3730a3] p-6 text-white shadow-[0_20px_50px_-20px_rgb(30_64_175/0.7)] ring-1 ring-white/10"
    >
      <span
        aria-hidden="true"
        className="absolute -top-16 -left-10 -z-10 size-56 rounded-full bg-sky-400/35 blur-3xl animate-aurora motion-reduce:animate-none"
      />
      <span
        aria-hidden="true"
        className="absolute -right-12 -bottom-20 -z-10 size-64 rounded-full bg-violet-400/30 blur-3xl animate-aurora-slow motion-reduce:animate-none"
      />
      <span
        aria-hidden="true"
        className="absolute top-1/3 right-1/4 -z-10 size-32 rounded-full bg-amber-300/15 blur-2xl animate-aurora motion-reduce:animate-none"
      />
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(120%_60%_at_50%_0%,rgb(255_255_255/0.14),transparent_60%)]" />

      <p className="text-sm font-medium text-white/80">Disponível para gastar</p>
      <Money cents={available} signed className="mt-1 block text-4xl font-semibold tracking-tight sm:text-5xl" />
      {deducted.length > 0 && <p className="mt-1 text-sm text-white/80">Já descontando {deducted.join(' e ')}</p>}

      <dl className="mt-6 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10 backdrop-blur-sm">
          <dt className="flex items-center gap-1 text-xs font-medium text-white/80">
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
            Receitas
          </dt>
          <dd className="mt-0.5 font-semibold">
            <Money cents={summary.income} />
          </dd>
        </div>
        <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10 backdrop-blur-sm">
          <dt className="flex items-center gap-1 text-xs font-medium text-white/80">
            <ArrowDownRight className="size-3.5" aria-hidden="true" />
            Despesas
          </dt>
          <dd className="mt-0.5 font-semibold">
            <Money cents={summary.expense} />
          </dd>
        </div>
      </dl>
    </section>
  )
}

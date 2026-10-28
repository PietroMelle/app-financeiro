import { ChevronRight, Target, Trophy } from 'lucide-react'
import { Link } from 'react-router'
import { formatCents } from '@/lib/money'
import { GoalBar } from './GoalCard'
import { goalProgress } from './goalRules'

const MAX = 3

// Metas no Resumo: as que faltam menos primeiro, ou um convite para criar a primeira.
export default function GoalsPreview({ goals, saved }) {
  if (goals.length === 0) {
    return (
      <Link
        to="/metas"
        className="flex min-h-16 items-center gap-3 rounded-2xl glass px-4 py-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
          <Target className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">Crie sua primeira meta</span>
          <span className="block text-sm text-muted-foreground">Uma viagem, a reserva de emergência, um curso…</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    )
  }

  const rows = goals
    .map((goal) => ({ goal, progress: goalProgress(goal, saved.get(goal.id) ?? 0) }))
    .sort((a, b) => Number(a.progress.reached) - Number(b.progress.reached) || b.progress.ratio - a.progress.ratio)
    .slice(0, MAX)

  return (
    <ul className="overflow-hidden rounded-2xl glass">
      {rows.map(({ goal, progress }) => (
        <li key={goal.id} className="border-b last:border-b-0">
          <Link
            to="/metas"
            className="grid gap-2 px-4 py-3 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <span className="flex items-baseline gap-2">
              {progress.reached && <Trophy className="size-4 shrink-0 self-center text-gold" aria-hidden="true" />}
              <span className="min-w-0 flex-1 truncate font-medium">{goal.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{formatCents(progress.saved)}</span> de{' '}
                {formatCents(goal.targetCents)}
              </span>
            </span>
            <GoalBar ratio={progress.ratio} label={`Progresso de ${goal.name}`} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

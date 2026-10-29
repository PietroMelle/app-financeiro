import { CalendarClock, EllipsisVertical, HandCoins, Pencil, PiggyBank, Target, Trash2, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { forwardRef } from 'react'
import Money from '@/components/Money'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import { goalStatus } from './goalRules'

const spring = { type: 'spring', bounce: 0, visualDuration: 0.5 }

export function GoalBar({ ratio, label, className }) {
  const percent = Math.round(ratio * 100)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn('h-2.5 overflow-hidden rounded-full bg-muted', className)}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: ratio }}
        transition={spring}
        className="h-full origin-left rounded-full bg-gradient-to-r from-amber-300 to-gold"
      />
    </div>
  )
}

const STATUS_LOOK = {
  reached: { icon: Trophy, tone: 'text-gold' },
  overdue: { icon: CalendarClock, tone: 'text-warning' },
  pace: { icon: CalendarClock, tone: 'text-muted-foreground' },
  left: { icon: Target, tone: 'text-muted-foreground' },
}

const GoalCard = forwardRef(function GoalCard({ goal, progress, index, onSave, onWithdraw, onEdit, onDelete }, ref) {
  const status = goalStatus(goal, progress)
  const { icon: StatusIcon, tone } = STATUS_LOOK[status.type]

  return (
    <motion.li
      ref={ref}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 8) * 0.05 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', bounce: 0, visualDuration: 0.35 }}
      className={cn('relative grid gap-4 overflow-hidden rounded-2xl glass p-4', progress.reached && 'ring-1 ring-gold/40')}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-10 size-32 rounded-full bg-gold/15 blur-2xl"
      />

      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
          {progress.reached ? <Trophy className="size-5" aria-hidden="true" /> : <Target className="size-5" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{goal.name}</h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            <Money cents={progress.saved} className="font-semibold text-foreground" /> de {formatCents(goal.targetCents)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mt-1 -mr-2 size-11" aria-label={`Ações para ${goal.name}`}>
              <EllipsisVertical className="size-5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onSelect={() => onWithdraw(goal)} disabled={progress.saved <= 0} className="h-11">
              <HandCoins aria-hidden="true" />
              Resgatar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(goal)} className="h-11">
              <Pencil aria-hidden="true" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(goal)} className="h-11">
              <Trash2 aria-hidden="true" />
              Apagar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className={cn('flex min-w-0 items-center gap-1.5', tone)}>
            <StatusIcon className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">{status.text}</span>
          </span>
          <span className="shrink-0 pl-2 font-semibold tabular-nums text-gold">{Math.round(progress.ratio * 100)}%</span>
        </div>
        <GoalBar ratio={progress.ratio} label={`Progresso de ${goal.name}`} />
      </div>

      <Button variant="outline" onClick={() => onSave(goal)} className="w-full border-gold/40 hover:bg-gold/10">
        <PiggyBank className="text-gold" aria-hidden="true" />
        Guardar
      </Button>
    </motion.li>
  )
})

export default GoalCard

import { AlertTriangle, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import CategoryIcon from '@/categories/CategoryIcon'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'

const LEVEL = {
  ok: { bar: 'bg-income', text: 'text-muted-foreground' },
  warning: { bar: 'bg-warning', text: 'text-warning' },
  over: { bar: 'bg-expense', text: 'text-expense' },
}

export default function BudgetRow({ row, href, index }) {
  const style = LEVEL[row.level]
  const percent = Math.round(row.ratio * 100)

  return (
    <li className="border-b last:border-b-0">
      <Link
        to={href}
        className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <CategoryIcon category={row} className="size-9" iconClassName="size-4.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-medium">{row.name}</span>
            <span className="shrink-0 text-sm tabular-nums">
              <span className="font-semibold">{formatCents(row.spent)}</span>
              <span className="text-muted-foreground"> de {formatCents(row.limit)}</span>
            </span>
          </div>

          <div
            role="progressbar"
            aria-label={`${row.name}: ${percent}% do limite`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(percent, 100)}
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          >
            <motion.div
              className={cn('h-full origin-left rounded-full', style.bar)}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: Math.min(row.ratio, 1) }}
              transition={{ type: 'spring', bounce: 0, visualDuration: 0.6, delay: Math.min(index, 6) * 0.05 }}
            />
          </div>

          <p className={cn('mt-1.5 flex items-center gap-1 text-sm tabular-nums', style.text)}>
            {row.level === 'over' ? (
              <>
                <AlertTriangle className="size-4" aria-hidden="true" />
                Passou {formatCents(-row.remaining)}
              </>
            ) : (
              <>
                Restam {formatCents(row.remaining)}
                <span className="text-muted-foreground"> · {percent}%</span>
              </>
            )}
          </p>
        </div>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  )
}

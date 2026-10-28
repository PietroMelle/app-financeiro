import { motion } from 'motion/react'
import { Link } from 'react-router'
import { amountTone, KINDS } from '@/categories/kinds'
import { dayLabel } from '@/lib/dates'
import { formatCents, formatSignedCents } from '@/lib/money'
import { cn } from '@/lib/utils'

// Guardado mostra a meta no lugar da categoria.
export function TransactionRow({ transaction, category, goal, showDate = false }) {
  const kind = KINDS[transaction.kind]
  const Icon = kind.icon
  const categoryName = transaction.kind === 'saving' ? (goal?.name ?? 'Meta') : (category?.name ?? 'Sem categoria')
  const title = transaction.description || categoryName
  const detail = transaction.description ? categoryName : transaction.kind === 'saving' && 'Guardado em meta'
  const subtitle = [showDate && dayLabel(transaction.occurred_on), detail]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="border-b last:border-b-0">
      <Link
        to={`/transacoes/${transaction.id}`}
        className="flex min-h-16 items-center gap-3 px-4 py-2 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', kind.tone)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{title}</span>
          {subtitle && <span className="block truncate text-sm text-muted-foreground">{subtitle}</span>}
        </span>
        <span className={cn('shrink-0 font-semibold tabular-nums', amountTone(transaction.kind))}>
          <span className="sr-only">{kind.singular}: </span>
          {formatSignedCents(transaction.amountCents, transaction.kind)}
        </span>
      </Link>
    </li>
  )
}

export default function TransactionList({ groups, categoriesById, goalsById = new Map() }) {
  return (
    <div className="grid gap-5">
      {groups.map((group, index) => (
        <motion.section
          key={group.date}
          aria-labelledby={`dia-${group.date}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, visualDuration: 0.3, delay: Math.min(index, 6) * 0.04 }}
        >
          <header className="mb-2 flex items-baseline justify-between px-1">
            <h2 id={`dia-${group.date}`} className="text-sm font-semibold">
              {dayLabel(group.date)}
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {group.total < 0 ? '−' : '+'} {formatCents(Math.abs(group.total))}
            </span>
          </header>
          <ul className="overflow-hidden rounded-xl glass">
            {group.items.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                category={categoriesById.get(t.categoryId)}
                goal={goalsById.get(t.goalId)}
              />
            ))}
          </ul>
        </motion.section>
      ))}
    </div>
  )
}

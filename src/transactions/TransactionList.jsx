import { motion } from 'motion/react'
import { Link } from 'react-router'
import CategoryIcon from '@/categories/CategoryIcon'
import { amountTone, isGoalKind, KINDS } from '@/categories/kinds'
import { dayLabel } from '@/lib/dates'
import { formatCents, formatSignedCents } from '@/lib/money'
import { cn } from '@/lib/utils'

const GOAL_DETAIL = { saving: 'Guardado em meta', withdrawal: 'Resgate da meta' }
const EMPTY = new Map()

// Guardado e resgate mostram a meta no lugar da categoria; transferência mostra "origem → destino".
// A conta só aparece quando a pessoa tem mais de uma (Q50).
export function TransactionRow({ transaction, category, goal, accountsById = EMPTY, showDate = false }) {
  const kind = KINDS[transaction.kind]
  const Icon = kind.icon
  const onGoal = isGoalKind(transaction.kind)
  const transfer = transaction.kind === 'transfer'
  const accountName = (accountId) => accountsById.get(accountId)?.name ?? 'Conta'
  const route = transfer && `${accountName(transaction.accountId)} → ${accountName(transaction.toAccountId)}`

  const label = onGoal ? (goal?.name ?? 'Meta') : transfer ? route : (category?.name ?? 'Sem categoria')
  const title = transaction.description || label
  const detail = transfer
    ? transaction.description
      ? route
      : kind.singular
    : transaction.description
      ? label
      : GOAL_DETAIL[transaction.kind]
  const account = !onGoal && !transfer && accountsById.size > 1 && accountName(transaction.accountId)
  const subtitle = [showDate && dayLabel(transaction.occurred_on), detail, account].filter(Boolean).join(' · ')

  return (
    <li className="border-b last:border-b-0">
      <Link
        to={`/transacoes/${transaction.id}`}
        className="flex min-h-16 items-center gap-3 px-4 py-2 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {!onGoal && !transfer && category ? (
          <CategoryIcon category={category} />
        ) : (
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', kind.tone)}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
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

export default function TransactionList({ groups, categoriesById, goalsById = EMPTY, accountsById = EMPTY }) {
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
                accountsById={accountsById}
              />
            ))}
          </ul>
        </motion.section>
      ))}
    </div>
  )
}

import { AlertCircle, ArrowLeft, CircleStop, EllipsisVertical, Pencil, Plus, Repeat, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { forwardRef, useMemo, useState } from 'react'
import { Link } from 'react-router'
import EmptyState from '@/components/EmptyState'
import { useToast } from '@/components/useToast'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAccounts } from '@/accounts/useAccounts'
import { KINDS } from '@/categories/kinds'
import { useCategories } from '@/categories/useCategories'
import { currentMonth, monthLabel, monthOf } from '@/lib/dates'
import { formatSignedCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useTransactions } from '@/transactions/useTransactions'
import RecurrenceFormDialog from './RecurrenceFormDialog'
import { endPlan, isActiveIn, recurrenceErrorMessage } from './recurringRules'
import { useRecurrences } from './useRecurrences'

const index = ({ year, month }) => year * 12 + month

function describe(recurrence, category, thisMonth) {
  const parts = [`Todo dia ${recurrence.dayOfMonth}`]
  if (category) parts.push(category.name)
  const start = monthOf(recurrence.startsOn)
  if (index(start) > index(thisMonth)) parts.push(`começa em ${monthLabel(start).toLowerCase()}`)
  else if (recurrence.endsOn) parts.push(`até ${monthLabel(monthOf(recurrence.endsOn)).toLowerCase()}`)
  return parts.join(' · ')
}

const RecurrenceRow = forwardRef(function RecurrenceRow({ recurrence, category, thisMonth, ended, index: i, onEdit, onEnd, onDelete }, ref) {
  const kind = KINDS[recurrence.kind]

  return (
    <motion.li
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.04 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', bounce: 0, visualDuration: 0.3 }}
      className="flex items-center gap-3 border-b py-2 pr-2 pl-4 last:border-b-0"
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', ended ? 'bg-muted text-muted-foreground' : kind.tone)}>
        <Repeat className="size-4.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate font-medium', ended && 'text-muted-foreground')}>{recurrence.description}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {ended ? `Encerrada em ${monthLabel(monthOf(recurrence.endsOn)).toLowerCase()}` : describe(recurrence, category, thisMonth)}
        </span>
      </span>
      <span
        className={cn(
          'shrink-0 font-semibold tabular-nums',
          ended ? 'text-muted-foreground' : recurrence.kind === 'income' ? 'text-income' : 'text-foreground',
        )}
      >
        <span className="sr-only">{kind.singular}: </span>
        {formatSignedCents(recurrence.amountCents, recurrence.kind)}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-11" aria-label={`Ações para ${recurrence.description}`}>
            <EllipsisVertical className="size-5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {!ended && (
            <>
              <DropdownMenuItem onSelect={() => onEdit(recurrence)} className="h-11">
                <Pencil aria-hidden="true" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onEnd(recurrence)} className="h-11">
                <CircleStop aria-hidden="true" />
                Encerrar
              </DropdownMenuItem>
            </>
          )}
          {ended && (
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(recurrence)} className="h-11">
              <Trash2 aria-hidden="true" />
              Apagar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.li>
  )
})

// state: { open, key, recurrence, mode: 'end' | 'delete' }
function EndDialog({ state, transactions, onClose, onEnd, onDelete }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const recurrence = state?.recurrence
  const plan = recurrence && state.mode === 'end' ? endPlan(recurrence, transactions) : { action: 'delete' }

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      if (plan.action === 'end') await onEnd(recurrence, plan.endsOn)
      else await onDelete(recurrence)
      onClose()
    } catch (err) {
      setError(recurrenceErrorMessage(err, plan.action === 'end' ? 'encerrar' : 'apagar'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog
      open={Boolean(state?.open)}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setError(null)
          onClose()
        }
      }}
    >
      <AlertDialogContent>
        {recurrence && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {state.mode === 'end' ? 'Encerrar' : 'Apagar'} “{recurrence.description}”?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {plan.action === 'end'
                  ? `Ela deixa de aparecer como prevista depois de ${monthLabel(monthOf(plan.endsOn)).toLowerCase()}. Os lançamentos já confirmados continuam.`
                  : 'Ela some da lista. Os lançamentos já confirmados continuam no histórico.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error && (
              <p role="alert" className="text-sm text-expense">
                {error}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
              <Button variant="destructive" onClick={confirm} disabled={busy}>
                {busy ? 'Aguarde…' : plan.action === 'end' ? 'Encerrar' : 'Apagar'}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ListSkeleton() {
  return (
    <ul aria-hidden="true" className="overflow-hidden rounded-2xl glass">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex min-h-16 items-center gap-3 border-b px-4 last:border-b-0">
          <span className="size-10 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          <span className="h-4 flex-1 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </li>
      ))}
    </ul>
  )
}

export default function RecurrencesPage() {
  const toast = useToast()
  const [thisMonth] = useState(() => currentMonth())
  const { recurrences, status, reload, create, update, remove } = useRecurrences()
  const { categories } = useCategories()
  const { accounts } = useAccounts()
  const { transactions } = useTransactions(thisMonth)
  const [form, setForm] = useState(null)
  const [ending, setEnding] = useState(null)

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const isEnded = (r) => !isActiveIn(r, thisMonth) && index(monthOf(r.startsOn)) <= index(thisMonth)
  const active = recurrences.filter((r) => !isEnded(r))
  const ended = recurrences.filter(isEnded)

  const openForm = (recurrence) => setForm({ recurrence, open: true, key: Date.now() })
  const closeForm = () => setForm((f) => f && { ...f, open: false })
  const openEnd = (recurrence, mode) => setEnding({ recurrence, mode, open: true, key: Date.now() })

  async function handleCreate(input) {
    await create(input)
    toast.show('Recorrente criada')
  }

  async function handleUpdate(id, input) {
    await update(id, input)
    toast.show('Recorrente atualizada')
  }

  async function handleEnd(recurrence, endsOn) {
    await update(recurrence.id, { ...recurrence, endsOn })
    toast.show('Recorrente encerrada')
  }

  async function handleDelete(recurrence) {
    await remove(recurrence.id)
    toast.show('Recorrente apagada')
  }

  const rows = (list, isOld) => (
    <ul className="relative overflow-hidden rounded-2xl glass">
      <AnimatePresence initial={false} mode="popLayout">
        {list.map((r, i) => (
          <RecurrenceRow
            key={r.id}
            recurrence={r}
            category={categoriesById.get(r.categoryId)}
            thisMonth={thisMonth}
            ended={isOld}
            index={i}
            onEdit={openForm}
            onEnd={(rec) => openEnd(rec, 'end')}
            onDelete={(rec) => openEnd(rec, 'delete')}
          />
        ))}
      </AnimatePresence>
    </ul>
  )

  return (
    <>
      <header className="mb-6 flex items-start gap-2">
        <Button asChild variant="ghost" size="icon" className="-ml-3 shrink-0">
          <Link to="/transacoes" aria-label="Voltar para transações">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Recorrentes</h1>
          <p className="mt-1 text-sm text-muted-foreground">O que se repete todo mês.</p>
        </div>
        <Button variant="outline" className="shrink-0" onClick={() => openForm(undefined)}>
          <Plus aria-hidden="true" />
          Nova
        </Button>
      </header>

      <div aria-busy={status === 'loading'} className="grid grid-cols-1 gap-6">
        {status === 'loading' && <ListSkeleton />}

        {status === 'error' && (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar as recorrentes"
            description="Verifique sua conexão e tente de novo."
            action={
              <Button variant="outline" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        )}

        {status === 'ready' && recurrences.length === 0 && (
          <EmptyState
            icon={Repeat}
            title="Nenhuma recorrente ainda"
            description="Cadastre contas fixas, assinaturas ou o salário. Todo mês elas aparecem como previstas, e você confirma com um toque."
            action={
              <Button onClick={() => openForm(undefined)}>
                <Plus aria-hidden="true" />
                Nova recorrente
              </Button>
            }
          />
        )}

        {status === 'ready' && active.length > 0 && rows(active, false)}

        {status === 'ready' && ended.length > 0 && (
          <section>
            <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">Encerradas</h2>
            {rows(ended, true)}
          </section>
        )}
      </div>

      <RecurrenceFormDialog
        state={form}
        categories={categories}
        accounts={accounts}
        onClose={closeForm}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
      <EndDialog
        key={ending?.key}
        state={ending}
        transactions={transactions}
        onClose={() => setEnding((e) => e && { ...e, open: false })}
        onEnd={handleEnd}
        onDelete={handleDelete}
      />
    </>
  )
}

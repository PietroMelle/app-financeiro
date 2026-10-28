import { Check, Repeat } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { forwardRef, useId, useState } from 'react'
import MoneyInput from '@/components/MoneyInput'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KINDS } from '@/categories/kinds'
import { monthOf, monthRange } from '@/lib/dates'
import { formatSignedCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import * as transactionsApi from '@/transactions/api'
import { transactionErrorMessage } from '@/transactions/transactionRules'

function confirm(item, { amountCents = item.amountCents, date = item.date } = {}) {
  return transactionsApi.createTransaction({
    kind: item.kind,
    amountCents,
    date,
    description: item.description,
    categoryId: item.categoryId,
    recurrenceId: item.recurrenceId,
  })
}

const PlannedRow = forwardRef(function PlannedRow({ item, category, index, busy, onAdjust, onConfirm }, ref) {
  const kind = KINDS[item.kind]

  return (
    <motion.li
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 10) * 0.04 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', bounce: 0, visualDuration: 0.3 }}
      className="flex items-center gap-1 border-b pr-3 last:border-b-0"
    >
      <button
        type="button"
        onClick={() => onAdjust(item)}
        aria-label={`Ajustar e confirmar ${item.description}`}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full border border-dashed border-current/40',
            kind.tone,
          )}
        >
          <Repeat className="size-4.5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{item.description}</span>
          <span className="block truncate text-sm text-muted-foreground">
            Previsto · dia {Number(item.date.slice(8, 10))}
            {category && ` · ${category.name}`}
          </span>
        </span>
        <span className="shrink-0 pr-1 font-semibold tabular-nums text-muted-foreground">
          <span className="sr-only">{kind.singular} prevista: </span>
          {formatSignedCents(item.amountCents, item.kind)}
        </span>
      </button>
      <Button
        size="sm"
        variant="outline"
        className="h-11 shrink-0 px-3"
        disabled={busy}
        onClick={() => onConfirm(item)}
        aria-label={`Confirmar ${item.description}`}
      >
        <Check aria-hidden="true" />
        <span className="hidden min-[400px]:inline">Confirmar</span>
      </Button>
    </motion.li>
  )
})

function AdjustForm({ item, onDone, onCancel }) {
  const id = useId()
  const [amountCents, setAmountCents] = useState(item.amountCents)
  const [date, setDate] = useState(item.date)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const range = monthRange(monthOf(item.date))

  async function handleSubmit(event) {
    event.preventDefault()
    if (!amountCents) return setError('Informe um valor.')
    if (!date || date < range.from || date > range.to) return setError('Use uma data dentro do mês.')
    setBusy(true)
    try {
      await confirm(item, { amountCents, date })
      onDone(item)
    } catch (err) {
      setError(transactionErrorMessage(err, 'confirmar'))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>Confirmar {item.description}</DialogTitle>
        <DialogDescription>Ajuste o valor ou a data se mudaram neste mês. A recorrente continua igual.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-amount`}>Valor</Label>
        <MoneyInput
          id={`${id}-amount`}
          cents={amountCents}
          onChange={(cents) => {
            setAmountCents(cents)
            setError(null)
          }}
          autoFocus
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base tabular-nums outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-date`}>Data</Label>
        <Input
          id={`${id}-date`}
          type="date"
          value={date}
          min={range.from}
          max={range.to}
          onChange={(e) => {
            setDate(e.target.value)
            setError(null)
          }}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-expense">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Confirmando…' : 'Confirmar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Previstos do mês (spec Q35): confirmar com um toque, ou tocar na linha para ajustar o valor.
export default function PlannedList({ planned, categoriesById, onConfirmed }) {
  const toast = useToast()
  const [busyId, setBusyId] = useState(null)
  const [adjusting, setAdjusting] = useState(null)

  async function quickConfirm(item) {
    setBusyId(item.recurrenceId)
    try {
      await confirm(item)
      toast.show(`${item.description} confirmado`)
      onConfirmed?.()
    } catch (err) {
      toast.show(transactionErrorMessage(err, 'confirmar'))
    } finally {
      setBusyId(null)
    }
  }

  function adjusted(item) {
    setAdjusting((a) => a && { ...a, open: false })
    toast.show(`${item.description} confirmado`)
    onConfirmed?.()
  }

  return (
    <>
      <ul className="relative overflow-hidden rounded-2xl glass">
        <AnimatePresence initial={false} mode="popLayout">
          {planned.map((item, index) => (
            <PlannedRow
              key={item.recurrenceId}
              item={item}
              category={categoriesById.get(item.categoryId)}
              index={index}
              busy={busyId === item.recurrenceId}
              onAdjust={(i) => setAdjusting({ item: i, open: true, key: Date.now() })}
              onConfirm={quickConfirm}
            />
          ))}
        </AnimatePresence>
      </ul>

      <Dialog open={Boolean(adjusting?.open)} onOpenChange={(open) => !open && setAdjusting((a) => a && { ...a, open: false })}>
        <DialogContent>
          {adjusting && (
            <AdjustForm
              key={adjusting.key}
              item={adjusting.item}
              onDone={adjusted}
              onCancel={() => setAdjusting((a) => a && { ...a, open: false })}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

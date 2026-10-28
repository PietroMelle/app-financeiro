import { useId, useState } from 'react'
import MoneyInput from '@/components/MoneyInput'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { currentMonth, monthKey, monthOf, monthRange, parseMonthKey, toISODate } from '@/lib/dates'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import { goalErrorMessage, validateGoal } from './goalRules'
import { transactionErrorMessage } from '@/transactions/transactionRules'

const FIELD =
  'h-11 w-full rounded-lg border border-input bg-card px-3 text-base tabular-nums outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

// Os diálogos recebem state = { open, key, goal? }; o conteúdo fica montado ao fechar
// para a animação de saída não piscar vazia.
function Shell({ state, busy, onClose, children }) {
  return (
    <Dialog open={Boolean(state?.open)} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent>{state && children}</DialogContent>
    </Dialog>
  )
}

export function GoalFormDialog({ state, onClose, onCreate, onUpdate }) {
  const [busy, setBusy] = useState(false)
  return (
    <Shell state={state} busy={busy} onClose={onClose}>
      <GoalForm key={state?.key} goal={state?.goal} onClose={onClose} onCreate={onCreate} onUpdate={onUpdate} onBusyChange={setBusy} />
    </Shell>
  )
}

function GoalForm({ goal, onClose, onCreate, onUpdate, onBusyChange }) {
  const id = useId()
  const isEdit = Boolean(goal)
  const [name, setName] = useState(goal?.name ?? '')
  const [targetCents, setTargetCents] = useState(goal?.targetCents ?? 0)
  const [deadlineMonth, setDeadlineMonth] = useState(goal?.deadline ? monthKey(monthOf(goal.deadline)) : '')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [thisMonth] = useState(() => monthKey(currentMonth()))

  const parsed = parseMonthKey(deadlineMonth)
  const input = { name, targetCents, deadline: parsed ? monthRange(parsed).to : null }
  const errors = validateGoal(input)
  if (deadlineMonth && !parsed) errors.deadline = 'Use o formato AAAA-MM.'
  const shown = submitted ? errors : {}

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    const first = Object.keys(errors)[0]
    if (first) return document.getElementById(`${id}-${first}`)?.focus()
    setBusy(true)
    onBusyChange(true)
    setServerError(null)
    try {
      if (isEdit) await onUpdate(goal.id, input)
      else await onCreate(input)
      onBusyChange(false)
      onClose()
    } catch (err) {
      setServerError(goalErrorMessage(err))
      setBusy(false)
      onBusyChange(false)
    }
  }

  const error = (field) =>
    shown[field] && (
      <p id={`${id}-${field}-error`} role="alert" className="text-sm text-expense">
        {shown[field]}
      </p>
    )

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Editar meta' : 'Nova meta'}</DialogTitle>
        <DialogDescription>
          Uma viagem, a reserva de emergência, um curso. O que você guardar sai do disponível para gastar.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-name`}>Nome</Label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Viagem para a praia"
          maxLength={60}
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(shown.name) || undefined}
          aria-describedby={shown.name ? `${id}-name-error` : undefined}
        />
        {error('name')}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-target`}>Quanto quer juntar</Label>
        <MoneyInput
          id={`${id}-target`}
          cents={targetCents}
          onChange={setTargetCents}
          aria-invalid={Boolean(shown.target) || undefined}
          aria-describedby={shown.target ? `${id}-target-error` : undefined}
          className={FIELD}
        />
        {error('target')}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-deadline`}>
          Até quando <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={`${id}-deadline`}
          type="month"
          value={deadlineMonth}
          min={thisMonth}
          placeholder="AAAA-MM"
          onChange={(e) => setDeadlineMonth(e.target.value)}
          aria-invalid={Boolean(shown.deadline) || undefined}
          aria-describedby={shown.deadline ? `${id}-deadline-error` : `${id}-deadline-hint`}
        />
        {error('deadline') || (
          <p id={`${id}-deadline-hint`} className="text-sm text-muted-foreground">
            Com prazo, o app calcula quanto guardar por mês.
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
          {serverError}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar meta'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function SaveDialog({ state, onClose, onSave }) {
  const [busy, setBusy] = useState(false)
  return (
    <Shell state={state} busy={busy} onClose={onClose}>
      <SaveForm key={state?.key} goal={state?.goal} progress={state?.progress} onClose={onClose} onSave={onSave} onBusyChange={setBusy} />
    </Shell>
  )
}

function SaveForm({ goal, progress, onClose, onSave, onBusyChange }) {
  const id = useId()
  const [amountCents, setAmountCents] = useState(progress?.perMonth ?? 0)
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!amountCents) return setError('Informe um valor.')
    if (!date) return setError('Informe a data.')
    setBusy(true)
    onBusyChange(true)
    try {
      await onSave(goal, { amountCents, date })
      onBusyChange(false)
      onClose()
    } catch (err) {
      setError(transactionErrorMessage(err, 'guardar'))
      setBusy(false)
      onBusyChange(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>Guardar em {goal.name}</DialogTitle>
        <DialogDescription>
          {progress?.perMonth
            ? `Para chegar no prazo, guarde ${formatCents(progress.perMonth)} por mês.`
            : 'O valor sai do disponível para gastar do mês.'}
        </DialogDescription>
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
          className={cn(FIELD, 'text-gold')}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-date`}>Data</Label>
        <Input id={`${id}-date`} type="date" value={date} max="9999-12-31" onChange={(e) => setDate(e.target.value)} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-expense">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function DeleteGoalDialog({ state, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const goal = state?.goal

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm(goal)
      onClose()
    } catch (err) {
      setError(goalErrorMessage(err, 'apagar'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog open={Boolean(state?.open)} onOpenChange={(open) => !open && !busy && onClose()}>
      <AlertDialogContent>
        {goal && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar a meta “{goal.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                {state.saved > 0
                  ? `Os ${formatCents(state.saved)} guardados nela também são apagados e voltam para o disponível dos meses em que foram guardados. Não dá para desfazer.`
                  : 'Não dá para desfazer.'}
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
                {busy ? 'Apagando…' : 'Apagar meta'}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { useId, useState } from 'react'
import MoneyInput from '@/components/MoneyInput'
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
import { sortByName } from '@/categories/categoryRules'
import { KIND_ORDER, KINDS } from '@/categories/kinds'
import { addMonths, currentMonth, monthKey, monthOf, monthRange, parseMonthKey, toISODate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { recurrenceErrorMessage, validateRecurrence } from './recurringRules'

const FIELD =
  'h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

function Choice({ name, value, checked, onChange, children }) {
  return (
    <label
      className={cn(
        'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ring',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-muted-foreground hover:text-foreground',
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  )
}

// state: { open, key, recurrence? } — sem recurrence é criação.
export default function RecurrenceFormDialog({ state, categories, onClose, onCreate, onUpdate }) {
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={Boolean(state?.open)} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        {state && (
          <RecurrenceForm
            key={state.key}
            recurrence={state.recurrence}
            categories={categories}
            onClose={onClose}
            onCreate={onCreate}
            onUpdate={onUpdate}
            onBusyChange={setBusy}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RecurrenceForm({ recurrence, categories, onClose, onCreate, onUpdate, onBusyChange }) {
  const id = useId()
  const isEdit = Boolean(recurrence)
  const [today] = useState(() => new Date())
  const [kind, setKind] = useState(recurrence?.kind ?? 'expense')
  const [description, setDescription] = useState(recurrence?.description ?? '')
  const [amountCents, setAmountCents] = useState(recurrence?.amountCents ?? 0)
  const [categoryId, setCategoryId] = useState(recurrence?.categoryId ?? null)
  const [day, setDay] = useState(String(recurrence?.dayOfMonth ?? today.getDate()))
  const [startNext, setStartNext] = useState(false)
  const [endMonth, setEndMonth] = useState(recurrence?.endsOn ? monthKey(monthOf(recurrence.endsOn)) : '')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)

  const startsOn = isEdit
    ? recurrence.startsOn
    : startNext
      ? monthRange(addMonths(currentMonth(today), 1)).from
      : toISODate(today)
  const parsedEnd = parseMonthKey(endMonth)
  const input = {
    kind,
    description,
    amountCents,
    categoryId,
    dayOfMonth: Number(day),
    startsOn,
    endsOn: parsedEnd ? monthRange(parsedEnd).to : null,
  }
  const errors = validateRecurrence(input)
  if (endMonth && !parsedEnd) errors.endsOn = 'Use o formato AAAA-MM.'
  const shown = submitted ? errors : {}
  const options = sortByName(categories.filter((c) => c.kind === kind))

  function setWorking(value) {
    setBusy(value)
    onBusyChange(value)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    const first = Object.keys(errors)[0]
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    setWorking(true)
    setServerError(null)
    try {
      if (isEdit) await onUpdate(recurrence.id, input)
      else await onCreate(input)
      setWorking(false)
      onClose()
    } catch (err) {
      setServerError(recurrenceErrorMessage(err))
      setWorking(false)
    }
  }

  const error = (name) =>
    shown[name] && (
      <p id={`${id}-${name}-error`} role="alert" className="text-sm text-expense">
        {shown[name]}
      </p>
    )
  const describedBy = (name) => (shown[name] ? `${id}-${name}-error` : undefined)

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Editar recorrente' : 'Nova recorrente'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Vale para os próximos previstos. O que já foi confirmado não muda.'
            : 'Contas fixas, assinaturas ou salário: todo mês ela aparece como prevista para você confirmar.'}
        </DialogDescription>
      </DialogHeader>

      {!isEdit && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Tipo</legend>
          <div className="grid grid-cols-2 gap-2">
            {KIND_ORDER.map((value) => {
              const Icon = KINDS[value].icon
              return (
                <Choice
                  key={value}
                  name={`${id}-kind`}
                  value={value}
                  checked={kind === value}
                  onChange={() => {
                    setKind(value)
                    setCategoryId(null)
                  }}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {KINDS[value].singular}
                </Choice>
              )
            })}
          </div>
        </fieldset>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`${id}-description`}>Nome</Label>
        <Input
          id={`${id}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={kind === 'income' ? 'Ex.: Salário' : 'Ex.: Aluguel, Netflix'}
          maxLength={200}
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(shown.description) || undefined}
          aria-describedby={describedBy('description')}
        />
        {error('description')}
      </div>

      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <div className="grid content-start gap-2">
          <Label htmlFor={`${id}-amount`}>Valor</Label>
          <MoneyInput
            id={`${id}-amount`}
            cents={amountCents}
            onChange={setAmountCents}
            aria-invalid={Boolean(shown.amount) || undefined}
            aria-describedby={describedBy('amount')}
            className={cn(FIELD, 'tabular-nums')}
          />
          {error('amount')}
        </div>
        <div className="grid content-start gap-2">
          <Label htmlFor={`${id}-day`}>Todo dia</Label>
          <Input
            id={`${id}-day`}
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            aria-invalid={Boolean(shown.day) || undefined}
            aria-describedby={describedBy('day') ?? `${id}-day-hint`}
          />
          {error('day')}
        </div>
      </div>
      {Number(day) > 28 && !shown.day && (
        <p id={`${id}-day-hint`} className="-mt-3 text-sm text-muted-foreground">
          Nos meses mais curtos, cai no último dia.
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`${id}-category`}>
          Categoria <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <select
          id={`${id}-category`}
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
          className={FIELD}
        >
          <option value="">Sem categoria</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {!isEdit && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Começa</legend>
          <div className="grid grid-cols-2 gap-2">
            <Choice name={`${id}-start`} value="now" checked={!startNext} onChange={() => setStartNext(false)}>
              Este mês
            </Choice>
            <Choice name={`${id}-start`} value="next" checked={startNext} onChange={() => setStartNext(true)}>
              Próximo mês
            </Choice>
          </div>
        </fieldset>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`${id}-endsOn`}>
          Termina em <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={`${id}-endsOn`}
          type="month"
          value={endMonth}
          min={monthKey(monthOf(startsOn))}
          placeholder="AAAA-MM"
          onChange={(e) => setEndMonth(e.target.value)}
          aria-invalid={Boolean(shown.endsOn) || undefined}
          aria-describedby={describedBy('endsOn')}
        />
        {error('endsOn')}
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
          {busy ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar recorrente'}
        </Button>
      </DialogFooter>
    </form>
  )
}

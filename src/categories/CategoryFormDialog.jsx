import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import MoneyInput from '@/components/MoneyInput'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { categoryErrorMessage, validateCategoryName } from './categoryRules'
import { KIND_ORDER, KINDS } from './kinds'

// state: { open, key, type: 'create', kind } | { open, key, type: 'edit', category } | null
// Os dados ficam no estado ao fechar para a animação de saída não piscar vazia.
export default function CategoryFormDialog({ state, categories, onClose, onCreate, onUpdate }) {
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={Boolean(state?.open)} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent>
        {state && (
          <CategoryForm
            key={state.key}
            state={state}
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

function CategoryForm({ state, categories, onClose, onCreate, onUpdate, onBusyChange }) {
  const id = useId()
  const isEdit = state.type === 'edit'
  const [name, setName] = useState(isEdit ? state.category.name : '')
  const [kind, setKind] = useState(isEdit ? state.category.kind : state.kind)
  const [limitCents, setLimitCents] = useState(isEdit ? (state.category.limitCents ?? 0) : 0)
  const [touched, setTouched] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  const validationError = validateCategoryName(name, categories, {
    ignoreId: isEdit ? state.category.id : undefined,
  })
  const error = (touched && validationError) || serverError

  function setWorking(value) {
    setBusy(value)
    onBusyChange(value)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setTouched(true)
    if (validationError) return
    setWorking(true)
    setServerError(null)
    try {
      if (isEdit) await onUpdate(state.category.id, { name, limitCents })
      else await onCreate({ name, kind, limitCents })
      setWorking(false)
      onClose()
    } catch (err) {
      setServerError(categoryErrorMessage(err))
      setWorking(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'As mudanças valem também para os lançamentos já feitos.'
            : 'Use categorias para agrupar seus gastos e receitas.'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-name`}>Nome</Label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setServerError(null)
          }}
          onBlur={() => setTouched(true)}
          maxLength={60}
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm text-expense">
            {error}
          </p>
        )}
      </div>

      {!isEdit && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Tipo</legend>
          <div className="grid grid-cols-2 gap-2">
            {KIND_ORDER.map((value) => {
              const option = KINDS[value]
              const Icon = option.icon
              return (
                <label
                  key={value}
                  className={cn(
                    'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ring',
                    kind === value
                      ? 'border-primary bg-primary/8 text-foreground'
                      : 'border-input text-muted-foreground hover:text-foreground',
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-kind`}
                    value={value}
                    checked={kind === value}
                    onChange={() => setKind(value)}
                    className="sr-only"
                  />
                  <Icon className={cn('size-4', value === 'income' ? 'text-income' : 'text-expense')} aria-hidden="true" />
                  {option.singular}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      {kind === 'expense' && (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-limit`}>
            Limite mensal <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <MoneyInput
            id={`${id}-limit`}
            cents={limitCents}
            onChange={setLimitCents}
            aria-describedby={`${id}-limit-hint`}
            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base tabular-nums outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <p id={`${id}-limit-hint`} className="text-sm text-muted-foreground">
            {limitCents ? 'Vale para todos os meses.' : 'Deixe em R$ 0,00 para não ter limite.'}
          </p>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar categoria'}
        </Button>
      </DialogFooter>
    </form>
  )
}

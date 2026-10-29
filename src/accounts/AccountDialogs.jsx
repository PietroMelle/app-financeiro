import { Check, Sparkles } from 'lucide-react'
import { createElement, useId, useState } from 'react'
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
import { colorSlots, slotColor } from '@/categories/categoryLook'
import { cn } from '@/lib/utils'
import AccountIcon from './AccountIcon'
import { ACCOUNT_TYPE_ORDER, accountErrorMessage, validateAccount } from './accountRules'
import { ACCOUNT_TYPES } from './accountTypes'

const FIELD =
  'h-11 w-full rounded-lg border border-input bg-card px-3 text-base tabular-nums outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
const COLOR_NAMES = ['Azul', 'Laranja', 'Verde-água', 'Amarelo', 'Rosa', 'Verde', 'Roxo', 'Vermelho']
const swatch =
  'relative grid size-9 cursor-pointer place-items-center rounded-full has-checked:ring-2 has-checked:ring-foreground has-checked:ring-offset-2 has-checked:ring-offset-background has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring'

// state: { open, key, account? } — sem account é criação.
export function AccountFormDialog({ state, accounts, onClose, onCreate, onUpdate }) {
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open={Boolean(state?.open)} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        {state && (
          <AccountForm
            key={state.key}
            account={state.account}
            accounts={accounts}
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

function AccountForm({ account, accounts, onClose, onCreate, onUpdate, onBusyChange }) {
  const id = useId()
  const isEdit = Boolean(account)
  const [name, setName] = useState(account?.name ?? '')
  const [type, setType] = useState(account?.type ?? 'checking')
  const [cents, setCents] = useState(Math.abs(account?.initialCents ?? 0))
  const [negative, setNegative] = useState((account?.initialCents ?? 0) < 0)
  const [color, setColor] = useState(account?.color ?? null)
  // Cartão (Q56): fechamento, vencimento e limite opcional.
  const [closingDay, setClosingDay] = useState(String(account?.closingDay ?? ''))
  const [dueDay, setDueDay] = useState(String(account?.dueDay ?? ''))
  const [limitCents, setLimitCents] = useState(account?.limitCents ?? 0)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)

  const isCredit = type === 'credit'
  const input = {
    name,
    type,
    // No cartão, o saldo começa em zero: as compras e os pagamentos formam a fatura.
    initialCents: isCredit ? 0 : negative ? -cents : cents,
    color,
    closingDay: closingDay === '' ? null : Number(closingDay),
    dueDay: dueDay === '' ? null : Number(dueDay),
    limitCents: isCredit ? limitCents : null,
  }
  const errors = validateAccount(input, accounts, { ignoreId: account?.id })
  const shown = submitted ? errors : {}
  const autoSlot = isEdit ? colorSlots(accounts).get(account.id) : (accounts.length % 8) + 1

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    const first = ['name', 'closingDay', 'dueDay'].find((field) => errors[field])
    if (first) return document.getElementById(`${id}-${first}`)?.focus()
    setBusy(true)
    onBusyChange(true)
    setServerError(null)
    try {
      if (isEdit) await onUpdate(account.id, input)
      else await onCreate(input)
      onBusyChange(false)
      onClose()
    } catch (err) {
      setServerError(accountErrorMessage(err))
      setBusy(false)
      onBusyChange(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Editar conta' : 'Nova conta'}</DialogTitle>
        <DialogDescription>Banco, carteira, poupança ou cartão de crédito: cada um com o seu saldo.</DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5">
        <AccountIcon account={{ type, slot: color ?? autoSlot }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{name.trim() || 'Prévia'}</span>
          <span className="block text-sm text-muted-foreground">{ACCOUNT_TYPES[type].label}</span>
        </span>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-name`}>Nome</Label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setServerError(null)
          }}
          placeholder="Ex.: Nubank, Itaú, Carteira"
          maxLength={40}
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(shown.name) || undefined}
          aria-describedby={shown.name ? `${id}-name-error` : undefined}
        />
        {shown.name && (
          <p id={`${id}-name-error`} role="alert" className="text-sm text-expense">
            {shown.name}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tipo</legend>
        <div className="grid grid-cols-2 gap-2">
          {ACCOUNT_TYPE_ORDER.map((value) => (
            <label
              key={value}
              className={cn(
                'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ring',
                type === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input text-muted-foreground hover:text-foreground',
              )}
            >
              <input
                type="radio"
                name={`${id}-type`}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
              />
              {createElement(ACCOUNT_TYPES[value].icon, { className: 'size-4', 'aria-hidden': true })}
              {ACCOUNT_TYPES[value].label}
            </label>
          ))}
        </div>
      </fieldset>

      {isCredit && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['closingDay', 'Fecha todo dia', closingDay, setClosingDay],
              ['dueDay', 'Vence todo dia', dueDay, setDueDay],
            ].map(([field, label, value, setValue]) => (
              <div key={field} className="grid content-start gap-2">
                <Label htmlFor={`${id}-${field}`}>{label}</Label>
                <Input
                  id={`${id}-${field}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  aria-invalid={Boolean(shown[field]) || undefined}
                  aria-describedby={shown[field] ? `${id}-${field}-error` : undefined}
                />
                {shown[field] && (
                  <p id={`${id}-${field}-error`} role="alert" className="text-sm text-expense">
                    {shown[field]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="-mt-2 text-sm text-muted-foreground">
            Estão na fatura do cartão. Compras depois do fechamento vão para a fatura seguinte.
          </p>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-limit`}>
              Limite <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <MoneyInput id={`${id}-limit`} cents={limitCents} onChange={setLimitCents} className={FIELD} />
          </div>
        </div>
      )}

      {!isCredit && (
      <div className="grid gap-2">
        <Label htmlFor={`${id}-initial`}>{isEdit ? 'Saldo inicial' : 'Quanto tem nela hoje'}</Label>
        <MoneyInput id={`${id}-initial`} cents={cents} onChange={setCents} aria-describedby={`${id}-initial-hint`} className={FIELD} />
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={negative}
            onChange={(e) => setNegative(e.target.checked)}
            className="size-4 accent-primary"
          />
          Está negativo (cheque especial)
        </label>
        <p id={`${id}-initial-hint`} className="text-sm text-muted-foreground">
          O saldo atual soma a este valor tudo o que entrar e sair da conta.
        </p>
      </div>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Cor</legend>
        <div className="flex flex-wrap gap-2.5">
          <label className={cn(swatch, 'bg-muted text-muted-foreground')} title="Automática">
            <input type="radio" name={`${id}-color`} checked={color == null} onChange={() => setColor(null)} className="sr-only" />
            <Sparkles className="size-4" aria-hidden="true" />
            <span className="sr-only">Automática</span>
          </label>
          {COLOR_NAMES.map((label, i) => (
            <label key={label} className={swatch} style={{ backgroundColor: slotColor(i + 1) }}>
              <input
                type="radio"
                name={`${id}-color`}
                checked={color === i + 1}
                onChange={() => setColor(i + 1)}
                className="sr-only"
              />
              {color === i + 1 && <Check className="size-4 text-white" aria-hidden="true" />}
              <span className="sr-only">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

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
          {busy ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar conta'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function DeleteAccountDialog({ state, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const account = state?.account

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm(account)
      onClose()
    } catch (err) {
      setError(accountErrorMessage(err, 'apagar'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog open={Boolean(state?.open)} onOpenChange={(open) => !open && !busy && onClose()}>
      <AlertDialogContent>
        {account && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar a conta “{account.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                Só dá para apagar uma conta sem lançamentos. Recorrentes ligadas a ela passam para a conta padrão.
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
                {busy ? 'Apagando…' : 'Apagar conta'}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}

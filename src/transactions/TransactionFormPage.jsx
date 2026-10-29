import { AlertCircle, ArrowLeft, PiggyBank, Repeat, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AccountPicker from '@/accounts/AccountPicker'
import { useAccounts } from '@/accounts/useAccounts'
import { buildInstallments, isCard, splitInstallments } from '@/cards/cardRules'
import { isGoalKind, KINDS } from '@/categories/kinds'
import { formatCents } from '@/lib/money'
import { useCategories } from '@/categories/useCategories'
import { useGoals } from '@/goals/useGoals'
import { monthKey, monthOf, toISODate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import QuickEntry from '@/quick/QuickEntry'
import * as recurringApi from '@/recurring/api'
import AmountInput from './AmountInput'
import * as api from './api'
import CategoryPicker from './CategoryPicker'
import KindToggle from './KindToggle'
import { transactionErrorMessage, validateTransaction } from './transactionRules'

const EDIT_TITLE = { saving: 'Editar valor guardado', withdrawal: 'Editar resgate', transfer: 'Editar transferência' }
const FORM_KINDS = ['expense', 'income', 'transfer']

// accountId null = conta padrão (Q50), resolvida quando as contas carregam.
const emptyForm = () => ({
  kind: 'expense',
  amountCents: 0,
  categoryId: null,
  accountId: null,
  toAccountId: null,
  date: toISODate(new Date()),
  description: '',
})

export default function TransactionFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const { categories, status: categoriesStatus } = useCategories()
  const { goals, saved } = useGoals()
  const { accounts, defaultAccount } = useAccounts()
  // Rascunho vindo do lançamento rápido do Resumo ("Ajustar") ou da tela de Contas ("Transferir").
  const [initial, setInitial] = useState(() =>
    isEdit ? null : { ...emptyForm(), ...(location.state?.draft ?? {}) },
  )
  const [draftKey, setDraftKey] = useState(0)
  const [loadError, setLoadError] = useState(false)

  function adjust(draft) {
    setInitial({ ...emptyForm(), ...draft })
    setDraftKey((k) => k + 1)
  }

  useEffect(() => {
    if (!isEdit) return
    api.getTransaction(Number(id)).then(
      (t) =>
        setInitial({
          kind: t.kind,
          amountCents: t.amountCents,
          categoryId: t.categoryId,
          goalId: t.goalId,
          accountId: t.accountId,
          toAccountId: t.toAccountId,
          date: t.occurred_on,
          description: t.description,
          installmentGroup: t.installmentGroup,
          installmentNumber: t.installmentNumber,
          installmentCount: t.installmentCount,
        }),
      () => setLoadError(true),
    )
  }, [id, isEdit])

  return (
    <>
      <header className="mb-6 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="-ml-3">
          <Link to="/transacoes" aria-label="Voltar para transações">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? (EDIT_TITLE[initial?.kind] ?? 'Editar lançamento') : 'Novo lançamento'}
        </h1>
      </header>

      {loadError ? (
        <EmptyState
          icon={AlertCircle}
          title="Lançamento não encontrado"
          description="Ele pode ter sido apagado."
          action={
            <Button asChild variant="outline">
              <Link to="/transacoes">Ver transações</Link>
            </Button>
          }
        />
      ) : initial ? (
        <>
          {!isEdit && (
            <QuickEntry
              categories={categories}
              goals={goals}
              saved={saved}
              accounts={accounts}
              onSaved={(draft) => navigate(`/transacoes?mes=${monthKey(monthOf(draft.date))}`)}
              onAdjust={adjust}
            />
          )}
          {!isEdit && (
            <p className="my-6 flex items-center gap-3 text-xs font-medium text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
              ou preencha os detalhes
            </p>
          )}
          <TransactionForm
            key={id ?? `new-${draftKey}`}
            id={isEdit ? Number(id) : null}
            initial={initial}
            categories={categories}
            categoriesStatus={categoriesStatus}
            goals={goals}
            accounts={accounts}
            defaultAccountId={defaultAccount?.id ?? null}
          />
        </>
      ) : (
        <div aria-busy="true" className="grid gap-4">
          <div className="mx-auto h-12 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          <div className="h-11 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
        </div>
      )}
    </>
  )
}

function TransactionForm({ id, initial, categories, categoriesStatus, goals, accounts, defaultAccountId }) {
  const formId = useId()
  const isSaving = isGoalKind(initial.kind)
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(initial)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [installments, setInstallments] = useState(initial.installments ?? 1)
  const createdRecurrence = useRef(null)
  const [[today, yesterday]] = useState(() => {
    const now = new Date()
    return [toISODate(now), toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))]
  })

  const isTransfer = form.kind === 'transfer'
  // Conta escolhida ou a padrão (Q50); guardado e resgate não têm conta (Q53).
  const effective = { ...form, accountId: isSaving ? null : (form.accountId ?? defaultAccountId) }
  // Q60: parcelar só em despesa nova no cartão.
  const onCard = isCard(accounts.find((a) => a.id === effective.accountId))
  const canSplit = !id && form.kind === 'expense' && onCard
  const parts = canSplit ? installments : 1
  const errors = validateTransaction(effective, categories)
  const shown = submitted ? errors : {}
  const fieldId = (name) => `${formId}-${name}`
  const errorId = (name) => (shown[name] ? `${formId}-${name}-error` : undefined)

  const update = (patch) => {
    setServerError(null)
    setForm((f) => ({ ...f, ...patch }))
  }

  function changeKind(kind) {
    const current = categories.find((c) => c.id === form.categoryId)
    update({
      kind,
      categoryId: kind === 'transfer' || (current && current.kind !== kind) ? null : form.categoryId,
      toAccountId: kind === 'transfer' ? form.toAccountId : null,
    })
    if (kind === 'transfer') setRepeat(false)
  }

  function backToMonth(date) {
    navigate(`/transacoes?mes=${monthKey(monthOf(date))}`)
  }

  // A recorrente começa neste lançamento, que já fica como a confirmação do mês.
  // Se o lançamento falhar, a nova tentativa reaproveita a recorrente já criada.
  async function createRepeating() {
    const category = categories.find((c) => c.id === effective.categoryId)
    const input = {
      kind: effective.kind,
      amountCents: effective.amountCents,
      categoryId: effective.categoryId,
      accountId: effective.accountId,
      description: effective.description.trim() || category?.name || KINDS[effective.kind].singular,
      dayOfMonth: Number(effective.date.slice(8, 10)),
      startsOn: effective.date,
    }
    const saved = createdRecurrence.current
    createdRecurrence.current = saved
      ? await recurringApi.updateRecurrence(saved.id, input)
      : await recurringApi.createRecurrence(input)
    await api.createTransaction({ ...effective, recurrenceId: createdRecurrence.current.id })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      document.getElementById(fieldId(Object.keys(errors)[0]))?.focus()
      return
    }
    setBusy(true)
    try {
      if (id) await api.updateTransaction(id, effective)
      else if (parts > 1) await api.createTransactions(buildInstallments(effective, parts, crypto.randomUUID()))
      else if (repeat) await createRepeating()
      else await api.createTransaction(effective)
      toast.show(
        id
          ? 'Lançamento atualizado'
          : parts > 1
            ? `Compra salva em ${parts}x`
            : repeat
              ? 'Salvo e repetido todo mês'
              : 'Lançamento salvo',
      )
      backToMonth(effective.date)
    } catch (err) {
      setServerError(transactionErrorMessage(err))
      setBusy(false)
    }
  }

  // Parcela (Q60): apaga só esta ou a compra toda.
  async function handleDelete(all = false) {
    setBusy(true)
    try {
      if (all) await api.deleteInstallments(form.installmentGroup)
      else await api.deleteTransaction(id)
      toast.show(all ? 'Compra apagada (todas as parcelas)' : 'Lançamento apagado')
      backToMonth(form.date)
    } catch (err) {
      setServerError(transactionErrorMessage(err, 'apagar'))
      setConfirmDelete(false)
      setBusy(false)
    }
  }

  const fieldError = (name) =>
    shown[name] && (
      <p id={errorId(name)} role="alert" className="mt-2 text-sm text-expense">
        {shown[name]}
      </p>
    )

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6">
      {isSaving ? (
        <p className="flex items-center justify-center gap-2 rounded-xl bg-gold/10 px-3 py-2.5 text-sm font-medium text-gold">
          <PiggyBank className="size-4" aria-hidden="true" />
          {form.kind === 'withdrawal' ? 'Resgate de meta' : 'Dinheiro guardado em meta'}
        </p>
      ) : (
        <KindToggle value={form.kind} onChange={changeKind} kinds={FORM_KINDS} />
      )}

      <div className="grid gap-1 text-center">
        <Label htmlFor={fieldId('amount')} className="justify-center text-muted-foreground">
          Valor
        </Label>
        <AmountInput
          id={fieldId('amount')}
          cents={form.amountCents}
          kind={form.kind}
          onChange={(amountCents) => update({ amountCents })}
          invalid={Boolean(shown.amount)}
          describedBy={errorId('amount')}
        />
        {shown.amount && (
          <p id={errorId('amount')} role="alert" className="text-sm text-expense">
            {shown.amount}
          </p>
        )}
      </div>

      {isSaving && (
        <div className="grid gap-2">
          <Label htmlFor={fieldId('goal')}>Meta</Label>
          <select
            id={fieldId('goal')}
            value={form.goalId ?? ''}
            onChange={(e) => update({ goalId: e.target.value ? Number(e.target.value) : null })}
            aria-invalid={Boolean(shown.goal) || undefined}
            aria-describedby={errorId('goal')}
            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {fieldError('goal')}
        </div>
      )}

      {!isSaving && !isTransfer && (
        <>
          {categoriesStatus === 'ready' ? (
            <div id={fieldId('category')} tabIndex={-1} className="outline-none">
              <CategoryPicker
                categories={categories}
                kind={form.kind}
                value={form.categoryId}
                onChange={(categoryId) => update({ categoryId })}
                describedBy={errorId('category')}
              />
              {fieldError('category')}
            </div>
          ) : (
            <div aria-hidden="true" className="flex flex-wrap gap-2">
              {[96, 80, 112, 72].map((w) => (
                <span key={w} style={{ width: w }} className="h-11 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
              ))}
            </div>
          )}
          {accounts.length > 1 && (
            <div id={fieldId('account')} tabIndex={-1} className="outline-none">
              <AccountPicker
                legend="Conta"
                accounts={accounts}
                value={effective.accountId}
                onChange={(accountId) => update({ accountId })}
                describedBy={errorId('account')}
              />
              {fieldError('account')}
            </div>
          )}
        </>
      )}

      {isTransfer && (
        <>
          <div id={fieldId('account')} tabIndex={-1} className="outline-none">
            <AccountPicker
              legend="De"
              accounts={accounts}
              value={effective.accountId}
              onChange={(accountId) =>
                update({ accountId, toAccountId: form.toAccountId === accountId ? null : form.toAccountId })
              }
              describedBy={errorId('account')}
            />
            {fieldError('account')}
          </div>
          <div id={fieldId('toAccount')} tabIndex={-1} className="outline-none">
            {accounts.length > 1 ? (
              <AccountPicker
                legend="Para"
                accounts={accounts}
                exclude={effective.accountId}
                value={form.toAccountId}
                onChange={(toAccountId) => update({ toAccountId })}
                describedBy={errorId('toAccount')}
              />
            ) : (
              <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                Para transferir, cadastre outra conta em{' '}
                <Link to="/contas" className="font-medium text-link underline-offset-4 hover:underline">
                  Contas
                </Link>
                .
              </p>
            )}
            {fieldError('toAccount')}
          </div>
        </>
      )}

      <div className="grid gap-2">
        <Label htmlFor={fieldId('date')}>Data</Label>
        <div className="flex flex-wrap gap-2">
          {[
            [today, 'Hoje'],
            [yesterday, 'Ontem'],
          ].map(([value, label]) => (
            <Button
              key={label}
              type="button"
              variant="outline"
              aria-pressed={form.date === value}
              onClick={() => update({ date: value })}
              className={cn(
                form.date === value &&
                  'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground dark:border-primary dark:bg-primary dark:hover:bg-primary/90',
              )}
            >
              {label}
            </Button>
          ))}
          <Input
            id={fieldId('date')}
            type="date"
            value={form.date}
            max="9999-12-31"
            onChange={(e) => update({ date: e.target.value })}
            aria-invalid={Boolean(shown.date) || undefined}
            aria-describedby={errorId('date')}
            className="min-w-40 flex-1"
          />
        </div>
        {shown.date && (
          <p id={errorId('date')} role="alert" className="text-sm text-expense">
            {shown.date}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId('description')}>
          Descrição <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={fieldId('description')}
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder={isTransfer ? 'Ex.: reserva do mês' : 'Ex.: padaria'}
          maxLength={200}
          autoComplete="off"
          aria-invalid={Boolean(shown.description) || undefined}
          aria-describedby={errorId('description')}
        />
        {shown.description && (
          <p id={errorId('description')} role="alert" className="text-sm text-expense">
            {shown.description}
          </p>
        )}
      </div>

      {canSplit && (
        <div className="grid gap-2">
          <Label htmlFor={fieldId('installments')}>Parcelas</Label>
          <select
            id={fieldId('installments')}
            value={installments}
            onChange={(e) => {
              setInstallments(Number(e.target.value))
              setRepeat(false)
            }}
            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value={1}>À vista</option>
            {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>
                {n}x
              </option>
            ))}
          </select>
          {parts > 1 && form.amountCents > 0 && (
            <p className="text-sm text-muted-foreground">
              {parts}x de {formatCents(splitInstallments(form.amountCents, parts).at(-1))}
              {splitInstallments(form.amountCents, parts)[0] !== splitInstallments(form.amountCents, parts).at(-1) &&
                ` (a primeira de ${formatCents(splitInstallments(form.amountCents, parts)[0])})`}
              , uma em cada fatura. Cada parcela conta como gasto no mês dela.
            </p>
          )}
        </div>
      )}

      {!id && !isTransfer && parts === 1 && (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl glass px-4 py-3 has-focus-visible:outline-2 has-focus-visible:outline-ring">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-primary"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 font-medium">
              <Repeat className="size-4 text-link" aria-hidden="true" />
              Repetir todo mês
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {repeat && form.date
                ? `Nos próximos meses aparece como previsto no dia ${Number(form.date.slice(8, 10))}, para você confirmar.`
                : 'Para contas fixas, assinaturas e salário.'}
            </span>
          </span>
        </label>
      )}

      {serverError && (
        <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? 'Salvando…' : id ? 'Salvar alterações' : isTransfer ? 'Transferir' : 'Salvar lançamento'}
      </Button>

      {id && (
        <div className="border-t pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className="w-full text-expense hover:bg-expense/10 hover:text-expense"
          >
            <Trash2 aria-hidden="true" />
            Apagar lançamento
          </Button>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={(open) => !busy && setConfirmDelete(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {form.installmentGroup ? `Apagar a parcela ${form.installmentNumber}/${form.installmentCount}?` : 'Apagar este lançamento?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {form.installmentGroup
                ? 'Esta parcela faz parte de uma compra parcelada. Você pode apagar só ela ou a compra toda. Não dá para desfazer.'
                : 'Ele sai da lista e dos totais do mês. Não dá para desfazer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            {form.installmentGroup && (
              <Button variant="outline" onClick={() => handleDelete(false)} disabled={busy}>
                Só esta parcela
              </Button>
            )}
            <Button variant="destructive" onClick={() => handleDelete(Boolean(form.installmentGroup))} disabled={busy}>
              {busy ? 'Apagando…' : form.installmentGroup ? `Todas as ${form.installmentCount}` : 'Apagar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

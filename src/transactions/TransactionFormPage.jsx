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
import { isGoalKind, KINDS } from '@/categories/kinds'
import { useCategories } from '@/categories/useCategories'
import { monthKey, monthOf, toISODate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useGoals } from '@/goals/useGoals'
import QuickEntry from '@/quick/QuickEntry'
import * as recurringApi from '@/recurring/api'
import AmountInput from './AmountInput'
import * as api from './api'
import CategoryPicker from './CategoryPicker'
import KindToggle from './KindToggle'
import { transactionErrorMessage, validateTransaction } from './transactionRules'

const EDIT_TITLE = { saving: 'Editar valor guardado', withdrawal: 'Editar resgate' }

const emptyForm = () => ({ kind: 'expense', amountCents: 0, categoryId: null, date: toISODate(new Date()), description: '' })

export default function TransactionFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const { categories, status: categoriesStatus } = useCategories()
  const { goals, saved } = useGoals()
  // Rascunho vindo do lançamento rápido do Resumo ("Ajustar").
  const [initial, setInitial] = useState(() => (isEdit ? null : (location.state?.draft ?? emptyForm())))
  const [draftKey, setDraftKey] = useState(0)
  const [loadError, setLoadError] = useState(false)

  function adjust(draft) {
    setInitial(draft)
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
          date: t.occurred_on,
          description: t.description,
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

function TransactionForm({ id, initial, categories, categoriesStatus, goals }) {
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
  const createdRecurrence = useRef(null)
  const [[today, yesterday]] = useState(() => {
    const now = new Date()
    return [toISODate(now), toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))]
  })

  const errors = validateTransaction(form, categories)
  const shown = submitted ? errors : {}
  const fieldId = (name) => `${formId}-${name}`
  const errorId = (name) => (shown[name] ? `${formId}-${name}-error` : undefined)

  const update = (patch) => {
    setServerError(null)
    setForm((f) => ({ ...f, ...patch }))
  }

  function changeKind(kind) {
    const current = categories.find((c) => c.id === form.categoryId)
    update({ kind, categoryId: current && current.kind !== kind ? null : form.categoryId })
  }

  function backToMonth(date) {
    navigate(`/transacoes?mes=${monthKey(monthOf(date))}`)
  }

  // A recorrente começa neste lançamento, que já fica como a confirmação do mês.
  // Se o lançamento falhar, a nova tentativa reaproveita a recorrente já criada.
  async function createRepeating() {
    const category = categories.find((c) => c.id === form.categoryId)
    const input = {
      kind: form.kind,
      amountCents: form.amountCents,
      categoryId: form.categoryId,
      description: form.description.trim() || category?.name || KINDS[form.kind].singular,
      dayOfMonth: Number(form.date.slice(8, 10)),
      startsOn: form.date,
    }
    const saved = createdRecurrence.current
    createdRecurrence.current = saved
      ? await recurringApi.updateRecurrence(saved.id, input)
      : await recurringApi.createRecurrence(input)
    await api.createTransaction({ ...form, recurrenceId: createdRecurrence.current.id })
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
      if (id) await api.updateTransaction(id, form)
      else if (repeat) await createRepeating()
      else await api.createTransaction(form)
      toast.show(id ? 'Lançamento atualizado' : repeat ? 'Salvo e repetido todo mês' : 'Lançamento salvo')
      backToMonth(form.date)
    } catch (err) {
      setServerError(transactionErrorMessage(err))
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await api.deleteTransaction(id)
      toast.show('Lançamento apagado')
      backToMonth(form.date)
    } catch (err) {
      setServerError(transactionErrorMessage(err, 'apagar'))
      setConfirmDelete(false)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6">
      {isSaving ? (
        <p className="flex items-center justify-center gap-2 rounded-xl bg-gold/10 px-3 py-2.5 text-sm font-medium text-gold">
          <PiggyBank className="size-4" aria-hidden="true" />
          {form.kind === 'withdrawal' ? 'Resgate de meta' : 'Dinheiro guardado em meta'}
        </p>
      ) : (
        <KindToggle value={form.kind} onChange={changeKind} />
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

      {isSaving ? (
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
          {shown.goal && (
            <p id={errorId('goal')} role="alert" className="text-sm text-expense">
              {shown.goal}
            </p>
          )}
        </div>
      ) : categoriesStatus === 'ready' ? (
        <div id={fieldId('category')} tabIndex={-1} className="outline-none">
          <CategoryPicker
            categories={categories}
            kind={form.kind}
            value={form.categoryId}
            onChange={(categoryId) => update({ categoryId })}
            describedBy={errorId('category')}
          />
          {shown.category && (
            <p id={errorId('category')} role="alert" className="mt-2 text-sm text-expense">
              {shown.category}
            </p>
          )}
        </div>
      ) : (
        <div aria-hidden="true" className="flex flex-wrap gap-2">
          {[96, 80, 112, 72].map((w) => (
            <span key={w} style={{ width: w }} className="h-11 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          ))}
        </div>
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
          placeholder="Ex.: padaria"
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

      {!id && (
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
        {busy ? 'Salvando…' : id ? 'Salvar alterações' : 'Salvar lançamento'}
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
            <AlertDialogTitle>Apagar este lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Ele sai da lista e dos totais do mês. Não dá para desfazer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy ? 'Apagando…' : 'Apagar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

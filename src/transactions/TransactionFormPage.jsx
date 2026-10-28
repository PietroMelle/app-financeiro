import { AlertCircle, ArrowLeft, Trash2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
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
import { useCategories } from '@/categories/useCategories'
import { monthKey, monthOf, toISODate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import AmountInput from './AmountInput'
import * as api from './api'
import CategoryPicker from './CategoryPicker'
import KindToggle from './KindToggle'
import { transactionErrorMessage, validateTransaction } from './transactionRules'

const emptyForm = () => ({ kind: 'expense', amountCents: 0, categoryId: null, date: toISODate(new Date()), description: '' })

export default function TransactionFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [initial, setInitial] = useState(() => (isEdit ? null : emptyForm()))
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    api.getTransaction(Number(id)).then(
      (t) => setInitial({ kind: t.kind, amountCents: t.amountCents, categoryId: t.categoryId, date: t.occurred_on, description: t.description }),
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
        <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? 'Editar lançamento' : 'Novo lançamento'}</h1>
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
        <TransactionForm key={id ?? 'new'} id={isEdit ? Number(id) : null} initial={initial} />
      ) : (
        <div aria-busy="true" className="grid gap-4">
          <div className="mx-auto h-12 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          <div className="h-11 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
        </div>
      )}
    </>
  )
}

function TransactionForm({ id, initial }) {
  const formId = useId()
  const navigate = useNavigate()
  const toast = useToast()
  const { categories, status: categoriesStatus } = useCategories()
  const [form, setForm] = useState(initial)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
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
      else await api.createTransaction(form)
      toast.show(id ? 'Lançamento atualizado' : 'Lançamento salvo')
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
      <KindToggle value={form.kind} onChange={changeKind} />

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

      {categoriesStatus === 'ready' ? (
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

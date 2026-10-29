import { Zap } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CategoryIcon from '@/categories/CategoryIcon'
import { amountTone, isGoalKind, KINDS } from '@/categories/kinds'
import { validateWithdrawal } from '@/goals/goalRules'
import { dayLabel } from '@/lib/dates'
import { formatSignedCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import * as api from '@/transactions/api'
import { transactionErrorMessage } from '@/transactions/transactionRules'
import { parseQuickEntry } from './parseQuickEntry'

const spring = { type: 'spring', bounce: 0, visualDuration: 0.25 }
const GOAL_LABEL = { saving: 'Guardar em meta', withdrawal: 'Resgatar de meta' }

function Preview({ draft, category, goal, account }) {
  const kind = KINDS[draft.kind]
  const Icon = kind.icon
  const onGoal = isGoalKind(draft.kind)
  const name = onGoal ? (goal?.name ?? GOAL_LABEL[draft.kind]) : (category?.name ?? 'Sem categoria')

  return (
    <div className="flex items-center gap-3">
      {!onGoal && category ? (
        <CategoryIcon category={category} />
      ) : (
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', kind.tone)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{draft.description || name}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {[draft.description && name, onGoal && !draft.description && kind.singular, dayLabel(draft.date), account?.name]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
      <span className={cn('shrink-0 font-semibold tabular-nums', amountTone(draft.kind))}>
        <span className="sr-only">{kind.singular}: </span>
        {formatSignedCents(draft.amountCents, draft.kind)}
      </span>
    </div>
  )
}

// Lançamento rápido (spec Q33): o texto vira uma prévia, e só salva quando a pessoa confirma.
// "guardei 200 viagem" e "resgatei 100 viagem" (Q47) vão para a meta que casar com o texto.
export default function QuickEntry({ categories, goals = [], saved = new Map(), accounts = [], onSaved, onAdjust, className }) {
  const id = useId()
  const toast = useToast()
  const [text, setText] = useState('')
  const [history, setHistory] = useState(null)
  const [pickedGoal, setPickedGoal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [today] = useState(() => new Date())

  const result = useMemo(
    () => parseQuickEntry(text, { categories, goals, accounts, history: history ?? [], today }),
    [text, categories, goals, accounts, history, today],
  )
  const parsed = result?.ok ? result.draft : null
  // Meta escolhida na prévia vale quando o texto não casou com nenhuma.
  const draft = parsed && isGoalKind(parsed.kind) && parsed.goalId == null ? { ...parsed, goalId: pickedGoal } : parsed
  const category = draft && categories.find((c) => c.id === draft.categoryId)
  const goal = draft && goals.find((g) => g.id === draft.goalId)
  const needsGoal = draft && isGoalKind(draft.kind) && !goal
  const tooMuch = draft?.kind === 'withdrawal' && goal ? validateWithdrawal(draft.amountCents, saved.get(goal.id) ?? 0) : null

  // O histórico só é buscado quando a pessoa começa a usar o campo.
  function loadHistory() {
    if (history) return
    setHistory([])
    api.listRecentDescribed().then(setHistory, () => {})
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!draft || busy || needsGoal || tooMuch) return
    setBusy(true)
    setError(null)
    try {
      await api.createTransaction(draft)
      toast.show(draft.kind === 'saving' ? `Guardado em ${goal.name}` : draft.kind === 'withdrawal' ? `Resgatado de ${goal.name}` : 'Lançamento salvo')
      setText('')
      setPickedGoal(null)
      onSaved?.(draft)
    } catch (err) {
      setError(transactionErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('rounded-2xl glass p-4', className)}>
      <label htmlFor={`${id}-text`} className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Zap className="size-4 text-gold" aria-hidden="true" />
        Lançamento rápido
      </label>
      <Input
        id={`${id}-text`}
        value={text}
        onChange={(e) => {
          loadHistory()
          setText(e.target.value)
          setError(null)
        }}
        onFocus={loadHistory}
        placeholder="Ex.: almoço 32 ou guardei 200 viagem"
        maxLength={200}
        autoComplete="off"
        enterKeyHint="done"
        aria-describedby={`${id}-preview`}
        className="h-12 text-base"
      />

      <div id={`${id}-preview`} aria-live="polite">
        <AnimatePresence initial={false}>
          {result && (
            <motion.div
              key={draft ? 'draft' : 'hint'}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={spring}
              className="mt-3"
            >
              {draft ? (
                <>
                  <p className="sr-only">Prévia:</p>
                  <div className="rounded-xl bg-muted px-3 py-2.5">
                    <Preview draft={draft} category={category} goal={goal} account={accounts.length > 1 && accounts.find((a) => a.id === draft.accountId)} />
                  </div>

                  {isGoalKind(draft.kind) && parsed.goalId == null && (
                    <div className="mt-3">
                      {goals.length > 0 ? (
                        <>
                          <label htmlFor={`${id}-goal`} className="mb-1.5 block text-sm font-medium">
                            Qual meta?
                          </label>
                          <select
                            id={`${id}-goal`}
                            value={pickedGoal ?? ''}
                            onChange={(e) => setPickedGoal(e.target.value ? Number(e.target.value) : null)}
                            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          >
                            <option value="">Escolha a meta</option>
                            {goals.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Você ainda não tem metas.{' '}
                          <Link to="/metas" className="font-medium text-link underline-offset-4 hover:underline">
                            Criar uma meta
                          </Link>
                        </p>
                      )}
                    </div>
                  )}

                  {tooMuch && (
                    <p role="alert" className="mt-2 text-sm text-expense">
                      {tooMuch}
                    </p>
                  )}

                  <div className="mt-3 flex gap-2">
                    {!isGoalKind(draft.kind) && (
                      <Button type="button" variant="outline" className="flex-1" onClick={() => onAdjust?.(draft)} disabled={busy}>
                        Ajustar
                      </Button>
                    )}
                    <Button type="submit" className="flex-1" disabled={busy || needsGoal || Boolean(tooMuch)}>
                      {busy ? 'Salvando…' : draft.kind === 'saving' ? 'Guardar' : draft.kind === 'withdrawal' ? 'Resgatar' : 'Salvar'}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Inclua o valor, por exemplo: almoço 32</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-expense">
          {error}
        </p>
      )}
    </form>
  )
}

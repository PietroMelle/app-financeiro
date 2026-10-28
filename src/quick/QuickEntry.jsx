import { Zap } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useMemo, useState } from 'react'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KINDS } from '@/categories/kinds'
import { dayLabel } from '@/lib/dates'
import { formatSignedCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import * as api from '@/transactions/api'
import { transactionErrorMessage } from '@/transactions/transactionRules'
import { parseQuickEntry } from './parseQuickEntry'

const spring = { type: 'spring', bounce: 0, visualDuration: 0.25 }

function Preview({ draft, category }) {
  const kind = KINDS[draft.kind]
  const Icon = kind.icon
  const categoryName = category?.name ?? 'Sem categoria'

  return (
    <div className="flex items-center gap-3">
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', kind.tone)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{draft.description || categoryName}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {[draft.description && categoryName, dayLabel(draft.date)].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className={cn('shrink-0 font-semibold tabular-nums', draft.kind === 'income' ? 'text-income' : 'text-foreground')}>
        <span className="sr-only">{kind.singular}: </span>
        {formatSignedCents(draft.amountCents, draft.kind)}
      </span>
    </div>
  )
}

// Lançamento rápido (spec Q33): o texto vira uma prévia, e só salva quando a pessoa confirma.
export default function QuickEntry({ categories, onSaved, onAdjust, className }) {
  const id = useId()
  const toast = useToast()
  const [text, setText] = useState('')
  const [history, setHistory] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [today] = useState(() => new Date())

  const result = useMemo(
    () => parseQuickEntry(text, { categories, history: history ?? [], today }),
    [text, categories, history, today],
  )
  const draft = result?.ok ? result.draft : null
  const category = draft && categories.find((c) => c.id === draft.categoryId)

  // O histórico só é buscado quando a pessoa começa a usar o campo.
  function loadHistory() {
    if (history) return
    setHistory([])
    api.listRecentDescribed().then(setHistory, () => {})
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!draft || busy) return
    setBusy(true)
    setError(null)
    try {
      await api.createTransaction(draft)
      toast.show('Lançamento salvo')
      setText('')
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
        placeholder="Ex.: almoço 32 ou recebi 200 ontem"
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
                    <Preview draft={draft} category={category} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => onAdjust?.(draft)} disabled={busy}>
                      Ajustar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={busy}>
                      {busy ? 'Salvando…' : 'Salvar'}
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

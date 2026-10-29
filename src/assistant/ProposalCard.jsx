import { CalendarDays, Check, CreditCard, Pencil } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { NEW_TRANSACTION_PATH } from '@/app/navItems'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { buildInstallments, splitInstallments } from '@/cards/cardRules'
import CategoryIcon from '@/categories/CategoryIcon'
import { KINDS } from '@/categories/kinds'
import { dayLabel } from '@/lib/dates'
import { formatCents, formatSignedCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import * as transactionsApi from '@/transactions/api'
import { transactionErrorMessage } from '@/transactions/transactionRules'
import { proposalDraft } from './assistantRules'
import { conversation } from './conversationStore'

const RING = { expense: 'ring-expense/25', income: 'ring-income/25', saving: 'ring-gold/30' }

// Card de confirmação (Q75): o assistente só propõe; quem salva é a pessoa.
export default function ProposalCard({ proposal, saved, categoriesById, accountsById, goalsById }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const kind = KINDS[proposal.kind]
  const category = categoriesById.get(proposal.categoryId)
  const place =
    proposal.kind === 'saving' ? goalsById.get(proposal.goalId)?.name : accountsById.get(proposal.accountId)?.name
  const label = proposal.kind === 'saving' ? 'Guardar na meta' : (category?.name ?? 'Sem categoria')
  const draft = proposalDraft(proposal)

  async function save() {
    setBusy(true)
    setError(null)
    try {
      if (draft.installments) {
        await transactionsApi.createTransactions(buildInstallments(draft, draft.installments, crypto.randomUUID()))
      } else {
        await transactionsApi.createTransaction(draft)
      }
      conversation.markSaved(proposal.id)
      toast.show('Lançamento salvo')
    } catch (err) {
      setError(transactionErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.2, visualDuration: 0.35 }}
      className={cn('grid gap-3 rounded-2xl glass p-4 ring-1', RING[proposal.kind])}
    >
      <div className="flex items-center gap-3">
        {category && proposal.kind !== 'saving' ? (
          <CategoryIcon category={category} />
        ) : (
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', kind.tone)}>
            <kind.icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{proposal.description || label}</p>
          <p className="truncate text-sm text-muted-foreground">{[label, place].filter(Boolean).join(' · ')}</p>
        </div>
        <p className={cn('shrink-0 text-lg font-semibold tabular-nums', proposal.kind === 'income' ? 'text-income' : proposal.kind === 'saving' ? 'text-gold' : 'text-foreground')}>
          <span className="sr-only">{kind.singular}: </span>
          {formatSignedCents(proposal.amountCents, proposal.kind)}
        </p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4" aria-hidden="true" />
          {dayLabel(proposal.date)}
        </span>
        {draft.installments && (
          <span className="flex items-center gap-1.5">
            <CreditCard className="size-4" aria-hidden="true" />
            Em {draft.installments}x de {formatCents(splitInstallments(proposal.amountCents, draft.installments)[1])}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-expense">
          {error}
        </p>
      )}

      {saved ? (
        <p className="flex items-center gap-2 rounded-xl bg-income/12 px-3 py-2.5 text-sm font-medium text-income">
          <Check className="size-4" aria-hidden="true" />
          Salvo
        </p>
      ) : (
        <div className="grid auto-cols-fr grid-flow-col gap-2">
          {/* O formulário novo não faz guardados: esses só se salvam daqui ou pela tela de Metas. */}
          {proposal.kind !== 'saving' && (
            <Button variant="outline" disabled={busy} onClick={() => navigate(NEW_TRANSACTION_PATH, { state: { draft } })}>
              <Pencil aria-hidden="true" />
              Editar
            </Button>
          )}
          <Button onClick={save} disabled={busy}>
            <Check aria-hidden="true" />
            {busy ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      )}
    </motion.div>
  )
}

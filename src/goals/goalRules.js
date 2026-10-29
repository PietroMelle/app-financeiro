import { currentMonth, monthLabel, monthOf } from '@/lib/dates'
import { formatCents } from '@/lib/money'

// Metas (spec Q37). O guardado é o que entrou ("saving") menos o que foi resgatado
// ("withdrawal", Q45), de todos os meses.

const MAX_NAME = 60
const index = ({ year, month }) => year * 12 + month

export function savedByGoal(transactions) {
  const saved = new Map()
  for (const t of transactions) {
    if (t.goalId == null) continue
    const delta = t.kind === 'saving' ? t.amountCents : t.kind === 'withdrawal' ? -t.amountCents : 0
    if (delta) saved.set(t.goalId, (saved.get(t.goalId) ?? 0) + delta)
  }
  return saved
}

// Resgate não passa do que está guardado na meta.
export function validateWithdrawal(amountCents, savedCents) {
  if (savedCents <= 0) return 'Ainda não há nada guardado nesta meta.'
  if (amountCents > savedCents) return `A meta tem só ${formatCents(savedCents)} guardados.`
  return null
}

export function goalProgress(goal, saved, today = new Date()) {
  const remaining = Math.max(goal.targetCents - saved, 0)
  const reached = remaining === 0
  const monthsLeft = goal.deadline ? index(monthOf(goal.deadline)) - index(currentMonth(today)) + 1 : null
  const overdue = !reached && monthsLeft !== null && monthsLeft < 1
  const perMonth = !reached && monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : null
  return {
    saved,
    remaining,
    ratio: Math.min(saved / goal.targetCents, 1),
    reached,
    monthsLeft,
    overdue,
    perMonth,
  }
}

// Frase que explica a situação da meta, para a pessoa não precisar fazer conta.
export function goalStatus(goal, progress) {
  if (progress.reached) return { type: 'reached', text: 'Meta alcançada' }
  const left = `Faltam ${formatCents(progress.remaining)}`
  if (progress.overdue) return { type: 'overdue', text: `${left} · o prazo passou` }
  if (progress.perMonth) {
    const until = monthLabel(monthOf(goal.deadline)).toLowerCase()
    return { type: 'pace', text: `${left} · guarde ${formatCents(progress.perMonth)} por mês até ${until}` }
  }
  return { type: 'left', text: left }
}

export function validateGoal({ name, targetCents }) {
  const errors = {}
  const text = name.trim()
  if (!text) errors.name = 'Dê um nome, por exemplo: Viagem.'
  else if (text.length > MAX_NAME) errors.name = `Use no máximo ${MAX_NAME} caracteres.`
  if (!targetCents || targetCents <= 0) errors.target = 'Informe quanto quer juntar.'
  return errors
}

export function goalErrorMessage(error, action = 'salvar') {
  if (error instanceof TypeError) return 'Sem conexão com o servidor. Verifique sua internet.'
  return `Não foi possível ${action}. Tente de novo.`
}

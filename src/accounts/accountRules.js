import { normalize } from '@/lib/text'

// Contas (spec Q48 a Q55). Saldo vem da view account_balances (Q51).

const MAX_NAME = 40
export const ACCOUNT_TYPE_ORDER = ['wallet', 'checking', 'savings', 'credit', 'other']

const key = (name) => normalize(name.trim())
const validDay = (day) => Number.isInteger(day) && day >= 1 && day <= 31

export function validateAccount({ name, type, closingDay, dueDay }, accounts, { ignoreId } = {}) {
  const errors = {}
  const text = name.trim()
  if (!text) errors.name = 'Dê um nome, por exemplo: Nubank.'
  else if (text.length > MAX_NAME) errors.name = `Use no máximo ${MAX_NAME} caracteres.`
  else if (accounts.some((a) => a.id !== ignoreId && key(a.name) === key(text))) errors.name = 'Já existe uma conta com esse nome.'
  if (!ACCOUNT_TYPE_ORDER.includes(type)) errors.type = 'Escolha o tipo da conta.'
  // Q56: cartão tem fechamento e vencimento.
  if (type === 'credit') {
    if (!validDay(closingDay)) errors.closingDay = 'Use um dia de 1 a 31.'
    if (!validDay(dueDay)) errors.dueDay = 'Use um dia de 1 a 31.'
  }
  return errors
}

// A marcada como padrão (Q50) ou, se nenhuma, a mais antiga.
export function defaultAccount(accounts) {
  if (!accounts.length) return null
  return accounts.find((a) => a.isDefault) ?? [...accounts].sort((a, b) => a.id - b.id)[0]
}

// Q61: cartão fica fora do "Saldo em contas" (a dívida dele aparece em "Faturas a pagar").
export function totalBalance(balances, accounts) {
  const cards = new Set((accounts ?? []).filter((a) => a.type === 'credit').map((a) => a.id))
  let total = 0
  for (const [id, cents] of balances) if (!cards.has(id)) total += cents
  return total
}

// Quanto se deve somando os cartões (saldo negativo do cartão).
export function cardsDebt(balances, accounts) {
  return accounts
    .filter((a) => a.type === 'credit')
    .reduce((sum, a) => sum + Math.max(-(balances.get(a.id) ?? 0), 0), 0)
}

export function accountErrorMessage(error, action = 'salvar') {
  if (error?.code === '23505') return 'Já existe uma conta com esse nome.'
  if (error?.code === '23503') return 'Esta conta tem lançamentos. Mova-os para outra conta antes de apagar.'
  if (error instanceof TypeError) return 'Sem conexão com o servidor. Verifique sua internet.'
  return `Não foi possível ${action}. Tente de novo.`
}

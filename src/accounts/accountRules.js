import { normalize } from '@/lib/text'

// Contas (spec Q48 a Q55). Saldo vem da view account_balances (Q51).

const MAX_NAME = 40
export const ACCOUNT_TYPE_ORDER = ['wallet', 'checking', 'savings', 'other']

const key = (name) => normalize(name.trim())

export function validateAccount({ name, type }, accounts, { ignoreId } = {}) {
  const errors = {}
  const text = name.trim()
  if (!text) errors.name = 'Dê um nome, por exemplo: Nubank.'
  else if (text.length > MAX_NAME) errors.name = `Use no máximo ${MAX_NAME} caracteres.`
  else if (accounts.some((a) => a.id !== ignoreId && key(a.name) === key(text))) errors.name = 'Já existe uma conta com esse nome.'
  if (!ACCOUNT_TYPE_ORDER.includes(type)) errors.type = 'Escolha o tipo da conta.'
  return errors
}

// A marcada como padrão (Q50) ou, se nenhuma, a mais antiga.
export function defaultAccount(accounts) {
  if (!accounts.length) return null
  return accounts.find((a) => a.isDefault) ?? [...accounts].sort((a, b) => a.id - b.id)[0]
}

export function totalBalance(balances) {
  let total = 0
  for (const cents of balances.values()) total += cents
  return total
}

export function accountErrorMessage(error, action = 'salvar') {
  if (error?.code === '23505') return 'Já existe uma conta com esse nome.'
  if (error?.code === '23503') return 'Esta conta tem lançamentos. Mova-os para outra conta antes de apagar.'
  if (error instanceof TypeError) return 'Sem conexão com o servidor. Verifique sua internet.'
  return `Não foi possível ${action}. Tente de novo.`
}

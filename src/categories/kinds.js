import { ArrowDownRight, ArrowUpRight, PiggyBank } from 'lucide-react'

export const KINDS = {
  expense: {
    singular: 'Despesa',
    plural: 'Despesas',
    icon: ArrowDownRight,
    tone: 'bg-expense/12 text-expense',
  },
  income: {
    singular: 'Receita',
    plural: 'Receitas',
    icon: ArrowUpRight,
    tone: 'bg-income/12 text-income',
  },
  // Guardado em meta (Q37): só lançamento, nunca categoria.
  saving: {
    singular: 'Guardado',
    plural: 'Guardados',
    icon: PiggyBank,
    tone: 'bg-gold/15 text-gold',
  },
}

// Tipos de categoria (guardado não tem categoria).
export const KIND_ORDER = ['expense', 'income']

// Cor do valor numa lista: receita verde, guardado dourado, despesa neutra.
export const amountTone = (kind) => (kind === 'income' ? 'text-income' : kind === 'saving' ? 'text-gold' : 'text-foreground')

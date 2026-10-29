import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, HandCoins, PiggyBank } from 'lucide-react'

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
  // Resgate de meta (Q45): o dinheiro volta para o disponível.
  withdrawal: {
    singular: 'Resgate',
    plural: 'Resgates',
    icon: HandCoins,
    tone: 'bg-gold/15 text-gold',
  },
  // Transferência entre contas (Q52): neutra, não é receita nem despesa.
  transfer: {
    singular: 'Transferência',
    plural: 'Transferências',
    icon: ArrowLeftRight,
    tone: 'bg-muted text-muted-foreground',
  },
}

// Tipos de categoria (guardado e resgate não têm categoria).
export const KIND_ORDER = ['expense', 'income']

// Guardado e resgate andam com uma meta, nunca com categoria.
export const isGoalKind = (kind) => kind === 'saving' || kind === 'withdrawal'

// Entra dinheiro no disponível: receita e resgate levam "+".
export const isInflow = (kind) => kind === 'income' || kind === 'withdrawal'

// Cor do valor numa lista: receita verde, meta dourada, despesa neutra.
export const amountTone = (kind) =>
  kind === 'income' ? 'text-income' : isGoalKind(kind) ? 'text-gold' : kind === 'transfer' ? 'text-muted-foreground' : 'text-foreground'

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

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
}

export const KIND_ORDER = ['expense', 'income']

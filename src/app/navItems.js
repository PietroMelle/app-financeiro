import { ArrowLeftRight, LayoutDashboard, Tags, UserRound } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Resumo', icon: LayoutDashboard, end: true },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/conta', label: 'Conta', icon: UserRound },
]

export const NEW_TRANSACTION_PATH = '/transacoes/nova'

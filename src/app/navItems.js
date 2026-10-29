import { ArrowLeftRight, ChartColumn, LayoutDashboard, Tags, Target, UserRound } from 'lucide-react'

// mobile: false fica só no menu lateral do PC; no celular, essas telas abrem pela Conta e pelo Resumo.
export const NAV_ITEMS = [
  { to: '/', label: 'Resumo', icon: LayoutDashboard, end: true },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/relatorios', label: 'Relatórios', icon: ChartColumn, mobile: false },
  { to: '/categorias', label: 'Categorias', icon: Tags, mobile: false },
  { to: '/conta', label: 'Conta', icon: UserRound },
]

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.mobile !== false)

export const NEW_TRANSACTION_PATH = '/transacoes/nova'

// Telas de painel: no PC usam a largura toda, em colunas.
export const WIDE_PATHS = ['/', '/relatorios']

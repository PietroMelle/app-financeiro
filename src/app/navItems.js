import { ArrowLeftRight, ChartColumn, LayoutDashboard, Tags, Target, UserRound, Wallet } from 'lucide-react'

// mobile: false fica só no menu lateral do PC; no celular, essas telas abrem pelo Perfil e pelo Resumo.
export const NAV_ITEMS = [
  { to: '/', label: 'Resumo', icon: LayoutDashboard, end: true },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/contas', label: 'Contas', icon: Wallet, mobile: false },
  { to: '/relatorios', label: 'Relatórios', icon: ChartColumn, mobile: false },
  { to: '/categorias', label: 'Categorias', icon: Tags, mobile: false },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.mobile !== false)

export const NEW_TRANSACTION_PATH = '/transacoes/nova'

// Telas de painel: no PC usam a largura toda, em colunas.
export const WIDE_PATHS = ['/', '/relatorios']

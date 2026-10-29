import { createElement } from 'react'
import { slotColor } from '@/categories/categoryLook'
import { cn } from '@/lib/utils'
import { ACCOUNT_TYPES } from './accountTypes'

// Ícone do tipo da conta (Q48) na cor da conta, como o das categorias.
export default function AccountIcon({ account, className, iconClassName }) {
  const color = slotColor(account?.slot)
  const icon = (ACCOUNT_TYPES[account?.type] ?? ACCOUNT_TYPES.other).icon
  return (
    <span
      aria-hidden="true"
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)` }}
      className={cn('grid size-10 shrink-0 place-items-center rounded-full', className)}
    >
      {createElement(icon, { className: cn('size-5', iconClassName) })}
    </span>
  )
}

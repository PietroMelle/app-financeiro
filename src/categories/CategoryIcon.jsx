import { createElement } from 'react'
import { cn } from '@/lib/utils'
import { categoryIcon } from './categoryIcons'
import { slotColor } from './categoryLook'

// Círculo com o ícone da categoria na cor dela (fundo é a mesma cor bem clara).
export default function CategoryIcon({ category, className, iconClassName }) {
  const color = slotColor(category?.slot)
  return (
    <span
      aria-hidden="true"
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)` }}
      className={cn('grid size-10 shrink-0 place-items-center rounded-full', className)}
    >
      {createElement(categoryIcon(category?.name), { className: cn('size-5', iconClassName) })}
    </span>
  )
}

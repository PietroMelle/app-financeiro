import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { forwardRef } from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import { KINDS } from './kinds'

const CategoryRow = forwardRef(function CategoryRow({ category, index, onEdit, onDelete }, ref) {
  const kind = KINDS[category.kind]
  const Icon = kind.icon

  return (
    <motion.li
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 10) * 0.04 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', bounce: 0, visualDuration: 0.3 }}
      className="flex items-center gap-3 border-b px-4 py-2 last:border-b-0"
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', kind.tone)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium" title={category.name}>
          {category.name}
        </span>
        {category.limitCents ? (
          <span className="block text-sm tabular-nums text-muted-foreground">
            Limite de {formatCents(category.limitCents)} por mês
          </span>
        ) : null}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Ações para ${category.name}`}>
            <EllipsisVertical className="size-5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onSelect={() => onEdit(category)} className="h-11">
            <Pencil aria-hidden="true" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(category)} className="h-11">
            <Trash2 aria-hidden="true" />
            Apagar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.li>
  )
})

export default CategoryRow

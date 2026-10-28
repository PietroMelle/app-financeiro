import { motion } from 'motion/react'
import { useId } from 'react'
import { KIND_ORDER, KINDS } from '@/categories/kinds'
import { cn } from '@/lib/utils'

export default function KindToggle({ value, onChange }) {
  const id = useId()

  return (
    <div role="radiogroup" aria-label="Tipo de lançamento" className="grid grid-cols-2 rounded-xl bg-muted p-1">
      {KIND_ORDER.map((kind) => {
        const option = KINDS[kind]
        const Icon = option.icon
        const selected = kind === value
        return (
          <label
            key={kind}
            className={cn(
              'relative flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ring',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <input
              type="radio"
              name={id}
              value={kind}
              checked={selected}
              onChange={() => onChange(kind)}
              className="sr-only"
            />
            {selected && (
              <motion.span
                layoutId={`${id}-indicator`}
                transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
                className="absolute inset-0 rounded-lg bg-card shadow-sm"
              />
            )}
            <Icon className={cn('relative size-4', kind === 'income' ? 'text-income' : 'text-expense')} aria-hidden="true" />
            <span className="relative">{option.singular}</span>
          </label>
        )
      })}
    </div>
  )
}

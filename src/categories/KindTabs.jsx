import { motion } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { KIND_ORDER, KINDS } from './kinds'

export default function KindTabs({ value, onChange, counts, idPrefix }) {
  const refs = useRef({})

  function handleKeyDown(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const next = KIND_ORDER[(KIND_ORDER.indexOf(value) + 1) % KIND_ORDER.length]
    onChange(next)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label="Tipo de categoria" className="flex rounded-xl bg-muted p-1">
      {KIND_ORDER.map((kind) => {
        const selected = kind === value
        return (
          <button
            key={kind}
            ref={(el) => (refs.current[kind] = el)}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${kind}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(kind)}
            onKeyDown={handleKeyDown}
            className={cn(
              'relative flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {selected && (
              <motion.span
                layoutId={`${idPrefix}-indicator`}
                transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
                className="absolute inset-0 rounded-lg bg-card shadow-sm"
              />
            )}
            <span className="relative">{KINDS[kind].plural}</span>
            {counts[kind] > 0 && (
              <span className="relative rounded-full bg-background px-1.5 text-xs tabular-nums text-muted-foreground">
                {counts[kind]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

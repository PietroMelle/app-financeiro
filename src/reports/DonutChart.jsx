import { ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import CategoryIcon from '@/categories/CategoryIcon'
import { slotColor } from '@/categories/categoryLook'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'

const SIZE = 168
const STROKE = 20
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R
const GAP = 2 // px de superfície entre fatias (dataviz: surface gap)

const percent = (share) => `${Math.round(share * 100)}%`

// Rosca de parte-do-todo (até 6 fatias, ver reportRules.byCategory). A legenda ao lado
// mostra nome, porcentagem e valor de toda fatia: a cor nunca é o único jeito de ler.
export default function DonutChart({ slices, total, label, hrefFor }) {
  const id = useId()
  const [active, setActive] = useState(null)
  const shown = slices.find((s) => s.id === active)

  // Cada fatia começa onde a anterior terminou; o vão de 2px sai do fim de cada uma.
  const gap = slices.length > 1 ? GAP : 0
  const arcs = slices.reduce((list, s) => {
    const start = list.length ? list.at(-1).start + list.at(-1).full : 0
    const full = s.share * C
    return [...list, { ...s, start, full, length: Math.max(full - gap, 0) }]
  }, [])

  return (
    // Legenda ao lado só quando o próprio card tem espaço (container query), não a tela.
    <div className="@container">
      <div className="grid items-center gap-5 @lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="relative mx-auto size-[168px]">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="size-full -rotate-90"
            role="img"
            aria-labelledby={`${id}-desc`}
          >
            <desc id={`${id}-desc`}>
              {label}: {slices.map((s) => `${s.name} ${percent(s.share)}`).join(', ')}
            </desc>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-muted" />
            {arcs.map((a, i) => (
              <motion.circle
                key={a.id ?? 'none'}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                strokeWidth={active === a.id ? STROKE + 4 : STROKE}
                style={{ stroke: slotColor(a.slot) }}
                strokeDashoffset={-a.start}
                initial={{ strokeDasharray: `0 ${C}` }}
                animate={{
                  strokeDasharray: `${a.length} ${C}`,
                  opacity: active === null || active === a.id ? 1 : 0.35,
                }}
                transition={{
                  type: 'spring',
                  bounce: 0,
                  visualDuration: 0.6,
                  delay: i * 0.06,
                }}
                onPointerEnter={() => setActive(a.id)}
                onPointerLeave={() => setActive(null)}
              />
            ))}
          </svg>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-content-center px-6 text-center"
          >
            <span className="truncate text-xs text-muted-foreground">{shown ? shown.name : 'Total'}</span>
            <span className="text-lg font-semibold tracking-tight">{formatCents(shown ? shown.cents : total)}</span>
            {shown && <span className="text-xs text-muted-foreground">{percent(shown.share)}</span>}
          </div>
        </div>

        <ul className="grid gap-1" aria-label={`${label}: legenda`}>
          {slices.map((s) => {
            const Row = hrefFor ? Link : 'div'
            const rowProps = hrefFor ? { to: hrefFor(s) } : { tabIndex: 0 }
            return (
              <li key={s.id ?? 'none'}>
                <Row
                  {...rowProps}
                  onPointerEnter={() => setActive(s.id)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(s.id)}
                  onBlur={() => setActive(null)}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-lg px-2 transition-colors outline-none focus-visible:outline-2 focus-visible:outline-ring',
                    active === s.id && 'bg-muted',
                  )}
                >
                  {typeof s.id === 'number' ? (
                    <CategoryIcon category={s} className="size-8" iconClassName="size-4" />
                  ) : (
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center">
                      <span className="size-3 rounded-full" style={{ backgroundColor: slotColor(undefined) }} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{percent(s.share)}</span>
                  <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {formatCents(s.cents)}
                  </span>
                  {hrefFor && (
                    <ChevronRight className="-ml-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                </Row>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
